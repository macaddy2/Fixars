import { supabase, TABLES } from '@/lib/supabase'

/**
 * Award points for a known action.
 *
 * SECURITY: the amount is resolved SERVER-side from the action key
 * (see award_points() in supabase/schema.sql) — the client never sends a raw
 * point value, so points cannot be minted from the browser.
 *
 * @param {string} action - action key, e.g. 'SUBMIT_IDEA'
 * @returns {Promise<number>} the new server-side balance
 */
export async function awardPointsDB(action) {
    const { data, error } = await supabase.rpc('award_points', { p_action: action })
    if (error) throw error
    return data
}

/**
 * Spend points atomically (server checks the balance during the write).
 *
 * @returns {Promise<number|false>} new balance, or false when declined
 */
export async function spendPointsDB(amount) {
    const { data, error } = await supabase.rpc('spend_points', { p_amount: amount })
    if (error) throw error
    if (data === null) return false // insufficient balance
    return data
}

// ── Fetch points history ──
export async function fetchPointsHistory(userId) {
    const { data, error } = await supabase
        .from(TABLES.POINTS_HISTORY)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

    if (error) throw error

    return (data || []).map(r => ({
        id: r.id,
        action: r.action,
        points: r.points,
        label: r.label,
        timestamp: r.created_at,
        ...r.metadata
    }))
}
