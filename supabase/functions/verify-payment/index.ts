// ============================================================================
//  Fixars Edge Function: verify-payment
//  Verifies a Paystack transaction and, on success, credits the user's wallet
//  ledger (which funds the stake debit) + marks the payment succeeded.
//
//  Secrets: PAYSTACK_SECRET_KEY (+ auto-provided Supabase env).
//  In production, prefer Paystack's *webhook* (paystack.webhook) pointing at
//  this same logic so credits land even if the user never returns.
// ============================================================================

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

function json(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const paystackKey = Deno.env.get('PAYSTACK_SECRET_KEY')
        if (!paystackKey) return json({ error: 'payments not configured' }, 500)

        // Caller must be authenticated (we verify ownership of the payment row)
        const authHeader = req.headers.get('Authorization') ?? ''
        const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        })
        const { data: { user }, error: userErr } = await userClient.auth.getUser()
        if (userErr || !user) return json({ error: 'not authenticated' }, 401)

        const { reference } = await req.json()
        if (!reference) return json({ error: 'reference is required' }, 400)

        const adminClient = createClient(supabaseUrl, serviceKey)

        const { data: payment } = await adminClient
            .from('payments')
            .select('*')
            .eq('provider_ref', reference)
            .single()
        if (!payment) return json({ error: 'payment not found' }, 404)
        if (payment.user_id !== user.id) return json({ error: 'forbidden' }, 403)
        if (payment.status === 'succeeded') return json({ status: 'succeeded' })

        // ── Verify with Paystack ──
        const vRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: { Authorization: `Bearer ${paystackKey}` },
        })
        const vData = await vRes.json()
        const tx = vData?.data
        if (!vData?.status || !tx) {
            console.error('paystack verify failed:', vData?.message)
            return json({ status: 'unknown', error: 'could not verify with provider' }, 502)
        }

        if (tx.status === 'success') {
            // Idempotency: provider_ref is UNIQUE; a replay of the same
            // verification can't double-credit because we only insert when the
            // row is still pending.
            if (payment.status === 'pending') {
                await adminClient.from('payments')
                    .update({
                        status: 'succeeded',
                        card_last4: tx.authorization?.last4 ?? null,
                        card_brand: tx.authorization?.card_type ?? null,
                    })
                    .eq('id', payment.id)

                // Credit the wallet ledger — the stake flow debits from here
                await adminClient.from('wallet_transactions').insert({
                    user_id: payment.user_id,
                    type: 'deposit',
                    label: `Wallet top-up · ${payment.stake_id ? 'campaign stake' : 'checkout'}`,
                    app: 'vestden',
                    amount: Number(payment.amount),
                    ref: `paid-${payment.provider_ref}`,
                })
            }
            return json({ status: 'succeeded', amount: Number(payment.amount) })
        }

        if (tx.status === 'failed' || tx.status === 'abandoned') {
            await adminClient.from('payments')
                .update({ status: 'failed' })
                .eq('id', payment.id)
            return json({ status: tx.status })
        }

        return json({ status: tx.status }) // ongoing/pending etc.
    } catch (err) {
        console.error('verify-payment error:', err)
        return json({ error: 'unexpected error' }, 500)
    }
})
