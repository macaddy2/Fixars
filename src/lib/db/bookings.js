import { supabase } from '@/lib/supabase'

/**
 * Create a booking (skill request) for a talent.
 * `projectTitle` is kept for API compatibility but is not stored — the
 * skill_requests table has no such column (only reviews.project_title).
 */
export async function createBookingRequest(requesterId, talentId, message) {
    if (!requesterId || !talentId) throw new Error('createBookingRequest requires requesterId and talentId')

    const { data, error } = await supabase
        .from('skill_requests')
        .insert({
            requester_id: requesterId,
            talent_id: talentId,
            message: message || null,
            status: 'pending'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating booking request:', error)
        throw error
    }

    return data
}

/**
 * Fetch bookings for a user (as requester)
 */
export async function fetchMyBookings(userId) {
    const { data, error } = await supabase
        .from('skill_requests')
        .select(`
            *,
            talent:talents!skill_requests_talent_id_fkey(
                id,
                hourly_rate,
                user_id,
                profile:profiles!talents_user_id_fkey(display_name, avatar_url)
            )
        `)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching bookings:', error)
        return []
    }

    return data.map(r => ({
        id: r.id,
        talentId: r.talent_id,
        talentName: r.talent?.profile?.display_name || 'Unknown',
        talentAvatar: r.talent?.profile?.avatar_url,
        hourlyRate: r.talent?.hourly_rate,
        message: r.message,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    }))
}

/**
 * Fetch incoming booking requests for a talent.
 * Note: requester contact happens via in-app messaging; emails are never
 * exposed through this endpoint (profiles.email is not publicly readable).
 */
export async function fetchIncomingBookings(talentId) {
    const { data, error } = await supabase
        .from('skill_requests')
        .select(`
            *,
            requester:profiles!skill_requests_requester_id_fkey(display_name, avatar_url)
        `)
        .eq('talent_id', talentId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching incoming bookings:', error)
        return []
    }

    return data.map(r => ({
        id: r.id,
        requesterId: r.requester_id,
        requesterName: r.requester?.display_name || 'Unknown',
        requesterAvatar: r.requester?.avatar_url,
        message: r.message,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    }))
}

/**
 * Update booking status (accept/reject/complete)
 */
export async function updateBookingStatus(requestId, newStatus) {
    const { data, error } = await supabase
        .from('skill_requests')
        .update({ status: newStatus })
        .eq('id', requestId)
        .select()
        .single()

    if (error) {
        console.error('Error updating booking status:', error)
        throw error
    }

    return data
}
