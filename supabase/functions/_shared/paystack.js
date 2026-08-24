export const PAYSTACK_CURRENCY = 'NGN'

export function parseNairaAmount(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null
    const text = String(value).trim()
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null

    const naira = Number(text)
    const subunit = Math.round(naira * 100)
    if (!Number.isSafeInteger(subunit) || subunit <= 0) return null
    return { naira: subunit / 100, subunit }
}

export function selectCallbackOrigin(requestedOrigin, requestOrigin, configuredOrigins) {
    const allowed = (configuredOrigins ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .map(normalizeOrigin)
        .filter((value) => value !== null)

    const candidate = normalizeOrigin(
        typeof requestedOrigin === 'string' && requestedOrigin.trim()
            ? requestedOrigin
            : requestOrigin ?? '',
    )
    return candidate && allowed.includes(candidate) ? candidate : null
}

function normalizeOrigin(value) {
    try {
        const url = new URL(value)
        if (url.pathname !== '/' || url.search || url.hash) return null
        return url.origin
    } catch {
        return null
    }
}

export async function verifyPaystackSignature(rawBody, signatureHex, secret) {
    if (!signatureHex || !/^[0-9a-f]{128}$/i.test(signatureHex)) return false
    const signature = new Uint8Array(signatureHex.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)))
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['verify'],
    )
    return crypto.subtle.verify('HMAC', key, signature, rawBody)
}

export function validatedPaystackTransaction(transaction, expected) {
    return transaction.status === 'success'
        && transaction.reference === expected.reference
        && Number.isSafeInteger(transaction.amount)
        && transaction.amount === expected.amountSubunit
        && transaction.currency === expected.currency
}

export async function settlePaystackPayment(adminClient, transaction) {
    const { data, error } = await adminClient.rpc('settle_paystack_payment', {
        p_provider_ref: transaction.reference,
        p_provider_amount_minor: transaction.amount,
        p_currency: transaction.currency,
        p_card_last4: transaction.authorization?.last4 ?? null,
        p_card_brand: transaction.authorization?.card_type ?? null,
    })
    if (error) throw new Error(`payment settlement failed: ${error.message}`)
    return data
}
