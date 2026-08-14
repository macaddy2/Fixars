import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { createJsonFileStore } from './json-file-store.js'

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

/**
 * File-backed SessionStore. Same port as the in-memory mock.
 * Session ids are still random; the client cannot mint one.
 */
export function createFileSessionStore({ dataDir, now = () => Date.now() } = {}) {
    if (!dataDir) throw new Error('createFileSessionStore requires dataDir')
    const store = createJsonFileStore(join(dataDir, 'sessions.json'), { sessions: {} })

    return {
        async create(user, opts = {}) {
            if (!user?.id || !user?.email) throw new Error('SessionStore.create requires id and email')
            const data = store.read()
            const id = randomBytes(32).toString('hex')
            const record = {
                id,
                user: { id: user.id, email: user.email, name: user.name || user.email.split('@')[0] },
                expiresAt: now() + (opts.ttlMs ?? DEFAULT_TTL_MS),
            }
            data.sessions[id] = record
            store.write(data)
            return { ...record, user: { ...record.user } }
        },

        async get(sessionId) {
            if (!sessionId) return null
            const data = store.read()
            const record = data.sessions[sessionId]
            if (!record) return null
            if (record.expiresAt <= now()) {
                delete data.sessions[sessionId]
                store.write(data)
                return null
            }
            return { ...record, user: { ...record.user } }
        },

        async destroy(sessionId) {
            if (!sessionId) return
            const data = store.read()
            if (!data.sessions[sessionId]) return
            delete data.sessions[sessionId]
            store.write(data)
        },
    }
}
