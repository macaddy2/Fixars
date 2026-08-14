import { randomBytes } from 'node:crypto'

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

/**
 * In-memory SessionStore. Swap for Redis / Postgres later.
 * Session ids are random; the client cannot mint a valid id.
 */
export function createMemorySessionStore({ now = () => Date.now() } = {}) {
    const sessions = new Map()

    return {
        async create(user, opts = {}) {
            if (!user?.id || !user?.email) throw new Error('SessionStore.create requires id and email')
            const id = randomBytes(32).toString('hex')
            const record = {
                id,
                user: { id: user.id, email: user.email, name: user.name || user.email.split('@')[0] },
                expiresAt: now() + (opts.ttlMs ?? DEFAULT_TTL_MS),
            }
            sessions.set(id, record)
            return { ...record, user: { ...record.user } }
        },

        async get(sessionId) {
            if (!sessionId) return null
            const record = sessions.get(sessionId)
            if (!record) return null
            if (record.expiresAt <= now()) {
                sessions.delete(sessionId)
                return null
            }
            return { ...record, user: { ...record.user } }
        },

        async destroy(sessionId) {
            if (sessionId) sessions.delete(sessionId)
        },

        /** Test helper — not part of the port. */
        _size() {
            return sessions.size
        },
    }
}
