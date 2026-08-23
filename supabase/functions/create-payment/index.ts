// ============================================================================
//  Fixars Edge Function: create-payment
//  Initiates a Paystack checkout for a VestDen campaign stake.
//
//  Secrets required (set via `supabase secrets set`):
//    PAYSTACK_SECRET_KEY  – sk_test_… / sk_live_…
//    SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY – provided
//    automatically by Supabase in the function runtime.
//
//  The client NEVER sees card data: it only receives an authorization_url and
//  redirects to Paystack's hosted page (PCI scope stays with Paystack).
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

        // ── Authenticate caller via their JWT ──
        const authHeader = req.headers.get('Authorization') ?? ''
        const userClient = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        })
        const { data: { user }, error: userErr } = await userClient.auth.getUser()
        if (userErr || !user) return json({ error: 'not authenticated' }, 401)

        const { stakeId, amount, origin } = await req.json()
        if (!stakeId || !amount || Number(amount) <= 0) {
            return json({ error: 'stakeId and a positive amount are required' }, 400)
        }

        // ── Validate the campaign server-side ──
        const adminClient = createClient(supabaseUrl, serviceKey)
        const { data: stake, error: stakeErr } = await adminClient
            .from('stakes')
            .select('id, title, status, target_amount, current_amount')
            .eq('id', stakeId)
            .single()
        if (stakeErr || !stake) return json({ error: 'campaign not found' }, 404)
        if (stake.status !== 'active') return json({ error: 'campaign is no longer active' }, 400)
        if (Number(stake.current_amount) + Number(amount) > Number(stake.target_amount)) {
            return json({ error: 'amount exceeds remaining funding target' }, 400)
        }

        // ── Create a Paystack transaction (kobo = naira × 100) ──
        const reference = `fixars-${crypto.randomUUID()}`
        const initRes = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${paystackKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: user.email,
                amount: Math.round(Number(amount) * 100),
                currency: 'NGN',
                reference,
                metadata: { stakeId, userId: user.id },
                callback_url: `${origin ?? ''}/wallet?payment=${reference}`,
            }),
        })
        const initData = await initRes.json()
        if (!initData?.status || !initData?.data?.authorization_url) {
            console.error('paystack initialize failed:', initData?.message)
            return json({ error: 'could not start payment' }, 502)
        }

        // ── Record the pending payment ──
        await adminClient.from('payments').insert({
            user_id: user.id,
            stake_id: stakeId,
            amount: Number(amount),
            currency: 'NGN',
            status: 'pending',
            provider: 'paystack',
            provider_ref: reference,
        })

        return json({ authorizationUrl: initData.data.authorization_url, reference })
    } catch (err) {
        console.error('create-payment error:', err)
        return json({ error: 'unexpected error' }, 500)
    }
})
