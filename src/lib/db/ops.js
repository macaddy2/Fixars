import { supabase } from '@/lib/supabase'

/**
 * Trust & operations access layer (M6).
 * Every function here is operator-gated SERVER-side by assert_operator();
 * the client-side gate is only cosmetic.

 * Pure: platform fee on a tranche, in major units (fee_bps of 10000 = 100%).
 */
export const computeFee = (tranche, bps = 0) =>
    Math.round(((Number(tranche) || 0) * (Number(bps) || 0)) / 10000 * 100) / 100

export async function amIOperator() {
    if (!isConfigured()) return false
    const { data, error } = await supabase.rpc('am_i_operator')
    if (error) return false
    return Boolean(data)
}

const isConfigured = () => {
    // Local import avoided to keep pure helpers import-light for tests.
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
        && ['1', 'true'].includes(String(import.meta.env.VITE_REAL_SESSION))
}

export async function fetchDisputes() {
    const { data, error } = await supabase.rpc('list_disputed_milestones')
    if (error) throw error
    return (data || []).map(d => ({
        milestoneId: d.milestone_id,
        milestoneTitle: d.milestone_title,
        campaignTitle: d.campaign_title,
        founderName: d.founder_name,
        tranche: Number(d.tranche),
        submittedAt: d.submitted_at,
        submissionNote: d.submission_note,
        held: Number(d.held || 0),
        disputedBy: d.disputed_by,
    }))
}

export async function resolveDisputeDB(milestoneId, outcome, feeBps = 0) {
    const { data, error } = await supabase.rpc('resolve_dispute', {
        p_milestone_id: milestoneId,
        p_outcome: outcome,
        p_fee_bps: feeBps,
    })
    if (error) throw error
    return data // 'released' | 'rework'
}

export async function fetchKycQueue() {
    const { data, error } = await supabase.rpc('list_kyc_queue')
    if (error) throw error
    return (data || []).map(u => ({
        userId: u.user_id,
        name: u.display_name,
        email: u.email,
        tier: u.kyc_tier,
        joinedAt: u.joined_at,
    }))
}

export const grantTier3DB = (userId) =>
    supabase.rpc('grant_kyc_tier3', { p_user_id: userId })

export async function fetchMyEscrowEvents(limit = 50) {
    const { data, error } = await supabase.rpc('fetch_my_escrow_events', { p_limit: limit })
    if (error) throw error
    return (data || []).map(normalizeEscrowEvent)
}

/** Map a raw fetch_my_escrow_events row for UI/ledger use. */
export function normalizeEscrowEvent(ev) {
    return {
        id: ev.event_id,
        campaignId: ev.campaign_id,
        campaignTitle: ev.campaign_title,
        milestoneId: ev.milestone_id,
        type: ev.type,
        amount: Number(ev.amount),
        createdAt: ev.created_at,
    }
}
