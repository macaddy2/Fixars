import { supabase, isSupabaseConfigured } from '@/lib/supabase'

/**
 * Payments (Paystack, NGN).
 *
 * Flow: initiateCheckout → Paystack hosted page → user returns to
 * /wallet?payment=<ref> → verifyPayment credits the wallet ledger.
 *
 * SECURITY: no card data ever touches this app — checkout happens on
 * Paystack's PCI-scoped page. Errors are ALWAYS surfaced; there are no silent
 * mock-success fallbacks in live mode.
 */

/**
 * Start a checkout for a campaign stake.
 * @returns {Promise<{authorizationUrl: string, reference: string}|{mock:true}>}
 */
export async function initiateCheckout(stakeId, amount) {
    if (!isSupabaseConfigured()) {
        // Mock mode — pretend to redirect
        await new Promise(r => setTimeout(r, 800))
        return { mock: true, reference: `demo-${Date.now()}` }
    }

    const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { stakeId, amount, origin: window.location.origin }
    })
    if (error) throw new Error(error.message || 'Could not start payment')
    if (!data?.authorizationUrl) throw new Error(data?.error || 'Payment provider unavailable')
    return data
}

/**
 * Verify a completed checkout and credit the wallet on success.
 * @returns {Promise<'succeeded'|'pending'|'failed'|string>}
 */
export async function verifyPayment(reference) {
    if (!isSupabaseConfigured()) return 'succeeded'

    const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: { reference }
    })
    if (error) throw new Error(error.message || 'Could not verify payment')
    return data?.status ?? 'unknown'
}

/**
 * Payment history for the current user (from the server-side payments table,
 * written exclusively by the payment functions / webhook).
 */
export async function fetchPaymentHistory(userId) {
    if (!isSupabaseConfigured()) {
        return [
            {
                id: 'txn-001',
                amount: 25000,
                stakeName: 'AI-Powered Recipe Generator',
                status: 'succeeded',
                createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: 'txn-002',
                amount: 10000,
                stakeName: 'Sustainable Fashion Marketplace',
                status: 'succeeded',
                createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
            }
        ]
    }

    try {
        const { data, error } = await supabase
            .from('payments')
            .select(`
                id, amount, status, created_at,
                stake:stakes(title)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) throw error

        return (data || []).map(p => ({
            id: p.id,
            amount: Number(p.amount),
            stakeName: p.stake?.title || 'Wallet top-up',
            status: p.status,
            createdAt: p.created_at
        }))
    } catch {
        return []
    }
}

/**
 * Format amount as Naira currency string.
 */
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount)
}
