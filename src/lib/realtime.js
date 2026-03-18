import { supabase, isSupabaseConfigured, TABLES } from '@/lib/supabase'

// ── Active channel registry ──
const channels = new Map()

/**
 * Subscribe to INSERT / UPDATE / DELETE events on a Supabase table.
 * Returns an unsubscribe function for use in useEffect cleanup.
 *
 * @param {string} table       - Table name from TABLES
 * @param {object} callbacks   - { onInsert, onUpdate, onDelete } handlers
 * @param {string} [filter]    - Optional Postgres filter, e.g. "user_id=eq.abc"
 * @returns {() => void}       - Cleanup function
 */
export function subscribeToTable(table, callbacks = {}, filter) {
    if (!isSupabaseConfigured()) return () => {}

    const channelName = `realtime:${table}:${filter || 'all'}`

    // Prevent duplicate subscriptions
    if (channels.has(channelName)) {
        channels.get(channelName).unsubscribe()
        channels.delete(channelName)
    }

    let channelBuilder = supabase
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table,
                ...(filter ? { filter } : {})
            },
            (payload) => {
                switch (payload.eventType) {
                    case 'INSERT':
                        callbacks.onInsert?.(payload.new)
                        break
                    case 'UPDATE':
                        callbacks.onUpdate?.(payload.new, payload.old)
                        break
                    case 'DELETE':
                        callbacks.onDelete?.(payload.old)
                        break
                }
            }
        )

    const channel = channelBuilder.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log(`[Realtime] ✓ Subscribed to ${table}`)
        }
        if (status === 'CHANNEL_ERROR') {
            console.warn(`[Realtime] ✗ Error on ${table}, retrying...`)
        }
    })

    channels.set(channelName, channel)

    return () => {
        channel.unsubscribe()
        channels.delete(channelName)
    }
}

/**
 * Subscribe to presence (online users) on a shared channel.
 * @param {string} channelName
 * @param {object} userInfo   - { userId, userName }
 * @param {function} onSync   - Called with array of present users
 * @returns {() => void}
 */
export function subscribeToPresence(channelName, userInfo, onSync) {
    if (!isSupabaseConfigured()) return () => {}

    const channel = supabase.channel(channelName)

    channel
        .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState()
            const users = Object.values(state).flat()
            onSync?.(users)
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({
                    user_id: userInfo.userId,
                    user_name: userInfo.userName,
                    online_at: new Date().toISOString()
                })
            }
        })

    channels.set(`presence:${channelName}`, channel)

    return () => {
        channel.unsubscribe()
        channels.delete(`presence:${channelName}`)
    }
}

/**
 * Unsubscribe from all active channels.
 */
export function unsubscribeAll() {
    for (const [name, channel] of channels) {
        channel.unsubscribe()
    }
    channels.clear()
}

/**
 * Get count of active subscriptions (for status indicator).
 */
export function getActiveSubscriptionCount() {
    return channels.size
}

// Re-export TABLES for convenience
export { TABLES }
