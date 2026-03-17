import { supabase, TABLES } from '@/lib/supabase'

// ── Award points ──
export async function awardPointsDB(userId, action, points, label, metadata = {}) {
    // Insert history record
    const { error: histError } = await supabase
        .from(TABLES.POINTS_HISTORY)
        .insert({
            user_id: userId,
            action,
            points,
            label,
            metadata
        })

    if (histError) throw histError

    // Update user's total points
    const { data: profile } = await supabase
        .from(TABLES.PROFILES)
        .select('points')
        .eq('id', userId)
        .single()

    const newPoints = (profile?.points || 0) + points

    const { error: updateError } = await supabase
        .from(TABLES.PROFILES)
        .update({
            points: newPoints,
            level: getLevel(newPoints)
        })
        .eq('id', userId)

    if (updateError) throw updateError

    return newPoints
}

// ── Spend points ──
export async function spendPointsDB(userId, amount, reason) {
    const { data: profile } = await supabase
        .from(TABLES.PROFILES)
        .select('points')
        .eq('id', userId)
        .single()

    if (!profile || profile.points < amount) return false

    const newPoints = profile.points - amount

    await supabase
        .from(TABLES.POINTS_HISTORY)
        .insert({
            user_id: userId,
            action: 'SPEND',
            points: -amount,
            label: reason
        })

    await supabase
        .from(TABLES.PROFILES)
        .update({
            points: newPoints,
            level: getLevel(newPoints)
        })
        .eq('id', userId)

    return newPoints
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

// ── Get level name from points ──
function getLevel(points) {
    const LEVELS = [
        { name: 'Newcomer', minPoints: 0 },
        { name: 'Explorer', minPoints: 100 },
        { name: 'Contributor', minPoints: 500 },
        { name: 'Pioneer', minPoints: 1000 },
        { name: 'Trailblazer', minPoints: 2500 },
        { name: 'Visionary', minPoints: 5000 },
        { name: 'Legend', minPoints: 10000 }
    ]
    return LEVELS.reduce((acc, level) => {
        if (points >= level.minPoints) return level.name
        return acc
    }, 'Newcomer')
}
