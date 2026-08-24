// ============================================================================
//  Fixars Edge Function: campaign-deadlines  (scheduled / cron)
//
//  Runs close_expired_campaigns() once for an authenticated scheduler request.
//  The caller must send x-scheduler-secret and the function must be deployed
//  with SCHEDULER_SECRET set to the same high-entropy value.
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createCampaignDeadlinesHandler } from './handler.js'

const handler = createCampaignDeadlinesHandler({
    getEnv: (name) => Deno.env.get(name),
    createAdmin: (url, key) => createClient(url, key),
})

Deno.serve(handler)
