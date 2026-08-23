import { supabase, TABLES } from '@/lib/supabase'

/**
 * Milestone & escrow access layer.
 * ALL writes go through SECURITY DEFINER RPCs (see supabase/schema.sql M1
 * block) — permission checks and money movement live server-side.
 */

/** Pure helper: validate a tranche schedule against the raised amount. */
export function validateTrancheSchedule(raisedAmount, tranches = []) {
    const committed = tranches.reduce((s, t) => s + Number(t.tranche || 0), 0)
    return {
        committed,
        remaining: Number(raisedAmount) - committed,
        valid: committed <= Number(raisedAmount),
    }
}

const mapMilestone = (m) => ({
    id: m.id,
    campaignId: m.campaign_id,
    boardId: m.board_id,
    title: m.title,
    description: m.description,
    tranche: Number(m.tranche),
    position: m.position,
    status: m.status,
    dueDate: m.due_date,
    submissionNote: m.submission_note,
    submittedAt: m.submitted_at,
    verifiedAt: m.verified_at,
})

export async function fetchCampaignMilestones(campaignId) {
    const { data, error } = await supabase.rpc('fetch_campaign_milestones', {
        p_campaign_id: campaignId,
    })
    if (error) throw error
    return (data || []).map(mapMilestone)
}

export async function getEscrowSummary(campaignId) {
    const { data, error } = await supabase.rpc('get_escrow_summary', {
        p_campaign_id: campaignId,
    })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null
    return {
        raised: Number(row.raised),
        held: Number(row.held),
        released: Number(row.released),
        status: row.status,
        isBacker: row.is_backer,
        isFounder: row.is_founder,
    }
}

export async function createMilestoneDB({ campaignId, title, description, tranche, dueDate, position }) {
    const { data, error } = await supabase.rpc('create_milestone', {
        p_campaign_id: campaignId,
        p_title: title,
        p_description: description || '',
        p_tranche: tranche,
        p_due_date: dueDate || null,
        p_position: position ?? 0,
    })
    if (error) throw error
    return data // milestone uuid
}

export const submitMilestoneDB = (milestoneId, note) =>
    supabase.rpc('submit_milestone', { p_milestone_id: milestoneId, p_note: note || '' })

export const verifyMilestoneDB = (milestoneId) =>
    supabase.rpc('verify_milestone', { p_milestone_id: milestoneId })

export const disputeMilestoneDB = (milestoneId) =>
    supabase.rpc('dispute_milestone', { p_milestone_id: milestoneId })

export const reworkMilestoneDB = (milestoneId) =>
    supabase.rpc('rework_milestone', { p_milestone_id: milestoneId })
