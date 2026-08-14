const jsonHeaders = { 'Content-Type': 'application/json' }

async function readJson(res) {
    const text = await res.text()
    if (!text) return null
    try {
        return JSON.parse(text)
    } catch {
        return null
    }
}

export async function fetchMe() {
    const res = await fetch('/api/me', { credentials: 'include' })
    if (res.status === 401) return null
    if (!res.ok) throw new Error('Failed to read server session')
    const data = await readJson(res)
    return data?.user ?? null
}

export async function createServerSession({ email, password, name }) {
    const res = await fetch('/api/session', {
        method: 'POST',
        credentials: 'include',
        headers: jsonHeaders,
        body: JSON.stringify({ email, password, name }),
    })
    const data = await readJson(res)
    if (!res.ok) {
        return { user: null, error: { message: data?.message || 'Could not create server session' } }
    }
    return { user: data.user, error: null }
}

export async function destroyServerSession() {
    await fetch('/api/session', { method: 'DELETE', credentials: 'include' })
}

export async function fetchWallet() {
    const res = await fetch('/api/wallet', { credentials: 'include' })
    if (res.status === 401) return null
    if (!res.ok) throw new Error('Failed to read wallet ledger')
    return readJson(res)
}

export async function requestPayout({ amount, destination }) {
    const res = await fetch('/api/wallet/payout', {
        method: 'POST',
        credentials: 'include',
        headers: jsonHeaders,
        body: JSON.stringify({ amount, destination }),
    })
    const data = await readJson(res)
    if (!res.ok) {
        return { ok: false, error: data?.message || 'Mock debit failed', snapshot: null }
    }
    return { ok: true, error: null, snapshot: data }
}

export async function fetchEscrow() {
    const res = await fetch('/api/escrow', { credentials: 'include' })
    if (res.status === 401) return null
    if (!res.ok) throw new Error('Failed to read escrow holds')
    return readJson(res)
}

export async function fetchKyc() {
    const res = await fetch('/api/kyc', { credentials: 'include' })
    if (res.status === 401 || res.status === 404) return null
    if (!res.ok) throw new Error('Failed to read KYC status')
    return readJson(res)
}
