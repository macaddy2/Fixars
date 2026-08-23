import { supabase, TABLES } from '@/lib/supabase'

/**
 * Fetch recent global activity feed entries.
 */
export async function fetchActivities(limit = 20) {
    const { data, error } = await supabase
        .from(TABLES.ACTIVITIES)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) throw error

    return (data || []).map(a => ({
        id: a.id,
        type: a.type,
        user: a.user_name,
        userId: a.user_id,
        message: a.message,
        app: a.app,
        timestamp: a.created_at
    }))
}

/**
 * Persist an activity entry. Fire-and-forget friendly: callers may await to
 * surface errors.
 */
export async function createActivityDB({ type, userId, userName, message, app }) {
    if (!userName || !message || !app) throw new Error('createActivityDB requires userName, message and app')

    const { error } = await supabase
        .from(TABLES.ACTIVITIES)
        .insert({
            type: type || 'general',
            user_id: userId || null,
            user_name: userName,
            message,
            app
        })

    if (error) throw error
}
