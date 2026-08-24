import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
    PAYSTACK_CURRENCY,
    settlePaystackPayment,
    validatedPaystackTransaction,
    verifyPaystackSignature,
} from '../_shared/paystack.js'

function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    })
}

Deno.serve(async (req) => {
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

    try {
        const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY')
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        if (!paystackKey || !supabaseUrl || !serviceKey) {
            return json({ error: 'payments not configured' }, 500)
        }

        // The signature covers the exact bytes received. Do not parse or
        // re-serialize the body before verifying it.
        const rawBody = new Uint8Array(await req.arrayBuffer())
        const validSignature = await verifyPaystackSignature(
            rawBody,
            req.headers.get('x-paystack-signature'),
            paystackKey,
        )
        if (!validSignature) return json({ error: 'invalid signature' }, 401)

        const event = JSON.parse(new TextDecoder().decode(rawBody))
        if (event?.event !== 'charge.success') return json({ received: true })

        const tx = event.data
        const reference = typeof tx?.reference === 'string' ? tx.reference : ''
        const adminClient = createClient(supabaseUrl, serviceKey)
        const { data: payment, error: paymentErr } = await adminClient
            .from('payments')
            .select('amount, currency, provider_ref')
            .eq('provider', 'paystack')
            .eq('provider_ref', reference)
            .single()
        if (paymentErr || !payment) return json({ error: 'payment not found' }, 404)

        const expectedAmount = Math.round(Number(payment.amount) * 100)
        if (!validatedPaystackTransaction(tx, {
            reference: payment.provider_ref,
            amountSubunit: expectedAmount,
            currency: payment.currency ?? PAYSTACK_CURRENCY,
        })) {
            console.error('signed Paystack event did not match the stored payment')
            return json({ error: 'provider transaction mismatch' }, 409)
        }

        await settlePaystackPayment(adminClient, tx)
        return json({ received: true })
    } catch (err) {
        console.error('paystack-webhook error:', err)
        return json({ error: 'unexpected error' }, 500)
    }
})
