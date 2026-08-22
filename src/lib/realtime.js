import { supabase, isSupabaseConfigured, TABLES } from '@/lib/supabase'

// ── Active channel registry (reference-counted so multiple subscribers can
//    share one channel without clobbering each other) ──
const channels = new Map() // name -> { channel, count }

function acquireChannel(name, build) {
    const entry = channels.get(name)
    if (entry) {
        entry.count += 1
        return entry.channel
    }
    const channel = build(name)
    channels.set(name, { channel, count: 1 })
    return channel
}

function releaseChannel(name, channel) {
    const entry = channels.get(name)
    // Only remove if the registry still points at *this* channel — a newer
    // subscriber may have replaced it under the same name.
    if (!entry || entry.channel !== channel) return
    entry.count -= 1
    if (entry.count <= 0) {
        channel.unsubscribe()
        channels.delete(name)
    }
}

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

    const channel = acquireChannel(channelName, (name) =>
        supabase
            .channel(name)
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
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] ✓ Subscribed to ${table}`)
                }
                if (status === 'CHANNEL_ERROR') {
                    console.warn(`[Realtime] ✗ Error on ${table}, retrying...`)
                }
            })
    )

    return () => releaseChannel(channelName, channel)
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

    const registryName = `presence:${channelName}`

    const channel = acquireChannel(registryName, () =>
        supabase.channel(channelName)
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()
                const users = Object.values(state).flat()
                onSync?.(users)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    try {
                        await channel.track({
                            user_id: userInfo.userId,
                            user_name: userInfo.userName,
                            online_at: new Date().toISOString()
                        })
                    } catch (err) {
                        console.warn('[Realtime] presence track failed:', err)
                    }
                }
            })
    )

    return () => releaseChannel(registryName, channel)
}

/**
 * Unsubscribe from all active channels.
 */
export function unsubscribeAll() {
    for (const channel of channels.values()) {
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
