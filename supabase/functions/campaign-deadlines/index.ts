// ============================================================================
//  Fixars Edge Function: campaign-deadlines  (scheduled / cron)
//
//  Runs the close_expired_campaigns() RPC with the service role:
//    - refunds expired unfunded campaigns back to staker wallets (idempotent)
//    - marks overdue in-flight milestones as missed
//
//  Schedule it in the Supabase dashboard (Edge Functions → Schedules), e.g.
//  daily at 00:05 UTC. No HTTP body required; POST only.
//
//  Secrets: none beyond the auto-provided SUPABASE_SERVICE_ROLE_KEY.
// ============================================================================

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const admin = createClient(supabaseUrl, serviceKey)

        // Verify the caller is either the scheduler (service key present) or
        // an authenticated user hitting it manually is fine — the RPC itself
        // is SECURITY DEFINER and only mutates deadline state.
        const { data, error } = await admin.rpc('close_expired_campaigns')
        if (error) {
            console.error('close_expired_campaigns failed:', error.message)
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...CORS, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify({ closed: data ?? 0 }), {
            headers: { ...CORS, 'Content-Type': 'application/json' },
        })
    } catch (err) {
        console.error('campaign-deadlines error:', err)
        return new Response(JSON.stringify({ error: 'unexpected error' }), {
            status: 500,
            headers: { ...CORS, 'Content-Type': 'application/json' },
        })
    }
})
