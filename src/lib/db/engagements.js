import { supabase } from '@/lib/supabase'

/**
 * Engagements — the SkillsCanvas ⇄ CollaBoard delivery loop.
 * Writes go through SECURITY DEFINER RPCs; reputation/proof-points live
 * server-side (see supabase/schema.sql M2 block).
 */

/** Pure: reputation delta for a rating (mirrors rate_engagement SQL). */
export const reputationDelta = (rating) =>
    rating >= 4 ? 5 : rating === 3 ? 0 : -8

/** Pure: was the delivery on time? */
export const isOnTime = (dueDate, now = new Date()) =>
    !dueDate || new Date(dueDate) >= new Date(now.toISOString().slice(0, 10))

export async function fetchMyEngagements() {
    const { data, error } = await supabase.rpc('fetch_my_engagements')
    if (error) throw error
    return (data || []).map(e => ({
        id: e.id,
        side: e.role, // 'hirer' | 'talent'
        status: e.status,
        roleTitle: e.role_title,
        rate: e.rate == null ? null : Number(e.rate),
        dueDate: e.due_date,
        onTime: e.on_time,
        rating: e.rating,
        counterpartName: e.counterpart_name,
        createdAt: e.created_at,
    }))
}

export const acceptBookingDB = (requestId) =>
    supabase.rpc('accept_booking', { p_request_id: requestId })

export const declineBookingDB = (requestId) =>
    supabase.rpc('decline_booking', { p_request_id: requestId })

export const deliverEngagementDB = (engagementId) =>
    supabase.rpc('deliver_engagement', { p_engagement_id: engagementId })

export const rateEngagementDB = (engagementId, rating) =>
    supabase.rpc('rate_engagement', { p_engagement_id: engagementId, p_rating: rating })
