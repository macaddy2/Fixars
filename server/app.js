import { createPorts } from './persistence.js'
import { assertPort } from './ports.js'
import { isKycPortFlag, isRealSessionFlag } from './flags.js'
import {
    cookieName,
    signSessionId,
    verifySessionCookie,
    serializeSessionCookie,
    clearSessionCookie,
    readCookie,
} from './signed-cookie.js'
import { parseJsonBody, sendJson, pathnameOf, userIdFromEmail } from './http-util.js'
import { assertSessionSecret, cookieShouldBeSecure } from './session-secret.js'

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

export function createApp(options = {}) {
    const realSession = options.realSession ?? isRealSessionFlag()
    const kycPort = options.kycPort ?? isKycPortFlag()
    const secret = options.sessionSecret ?? process.env.SESSION_SECRET ?? ''
    const secureCookie = options.secureCookie ?? process.env.COOKIE_SECURE === '1'
    const ports = options.ports ?? createPorts()
    const holder = ports.holder || ports.escrow

    assertPort('SessionStore', ports.sessions)
    assertPort('WalletLedger', ports.ledger)
    assertPort('EscrowHold', ports.escrow)
    assertPort('Holder', holder)
    assertPort('KycProvider', ports.kyc)

    if (realSession) {
        assertSessionSecret(secret)
    }

    async function readSession(req) {
        const raw = readCookie(req.headers.cookie, cookieName())
        const sessionId = verifySessionCookie(raw, secret)
        if (!sessionId) return null
        return ports.sessions.get(sessionId)
    }

    function setSessionCookie(req, res, session) {
        const token = signSessionId(session.id, secret)
        const maxAgeSec = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000))
        const secure = cookieShouldBeSecure(req, { secureCookie })
        return {
            'Set-Cookie': serializeSessionCookie(token, { maxAgeSec, secure }),
        }
    }

    async function requireSession(req, res) {
        const session = await readSession(req)
        if (!session) {
            sendJson(res, 401, { error: 'unauthenticated', message: 'Valid server session required.' })
            return null
        }
        return session
    }

    async function handleApi(req, res) {
        const path = pathnameOf(req)
        const method = req.method || 'GET'

        if (path === '/api/health' && method === 'GET') {
            sendJson(res, 200, {
                ok: true,
                realSession,
                kycPort,
                rails: 'mock',
                liveRails: false,
            })
            return
        }

        if (!realSession) {
            sendJson(res, 404, {
                error: 'real_session_off',
                message: 'Server session stack is flagged off. Set REAL_SESSION=1 on the server and VITE_REAL_SESSION=1 on the client build.',
            })
            return
        }

        try {
            if (path === '/api/session' && method === 'POST') {
                const body = await parseJsonBody(req)
                const email = String(body.email || '').trim().toLowerCase()
                const password = String(body.password || '')
                const name = String(body.name || '').trim() || email.split('@')[0] || 'User'
                if (!email || !email.includes('@')) {
                    sendJson(res, 400, { error: 'invalid_email', message: 'A valid email is required.' })
                    return
                }
                if (!password) {
                    sendJson(res, 400, { error: 'invalid_password', message: 'Password is required.' })
                    return
                }
                // Mock identity only — any email+password pair is accepted.
                // The session is still server-issued; a client-supplied session field is ignored.
                const user = { id: userIdFromEmail(email), email, name }
                const session = await ports.sessions.create(user, { ttlMs: DEFAULT_TTL_MS })
                sendJson(res, 200, { user: session.user }, setSessionCookie(req, res, session))
                return
            }

            if (path === '/api/session' && method === 'DELETE') {
                const raw = readCookie(req.headers.cookie, cookieName())
                const sessionId = verifySessionCookie(raw, secret)
                if (sessionId) await ports.sessions.destroy(sessionId)
                sendJson(res, 200, { ok: true }, {
                    'Set-Cookie': clearSessionCookie({ secure: cookieShouldBeSecure(req, { secureCookie }) }),
                })
                return
            }

            if (path === '/api/me' && method === 'GET') {
                const session = await requireSession(req, res)
                if (!session) return
                sendJson(res, 200, { user: session.user })
                return
            }

            if (path === '/api/wallet' && method === 'GET') {
                const session = await requireSession(req, res)
                if (!session) return
                const snapshot = await ports.ledger.getSnapshot(session.user.id)
                sendJson(res, 200, snapshot)
                return
            }

            if (path === '/api/wallet/payout' && method === 'POST') {
                const session = await requireSession(req, res)
                if (!session) return
                const body = await parseJsonBody(req)
                const snapshot = await ports.ledger.payout(session.user.id, body.amount, {
                    label: 'Mock payout — no live processor',
                    destination: body.destination || 'unspecified',
                })
                sendJson(res, 200, snapshot)
                return
            }

            if (path === '/api/escrow' && method === 'GET') {
                const session = await requireSession(req, res)
                if (!session) return
                const holds = await holder.list(session.user.id)
                const info = await holder.info()
                sendJson(res, 200, { holds, ...info })
                return
            }

            if (path.startsWith('/api/kyc')) {
                if (!kycPort) {
                    sendJson(res, 404, {
                        error: 'kyc_port_off',
                        liveNetwork: false,
                        message: 'KYC port is flagged off. Set KYC_PORT=1 for the mock NIN/BVN adapter. Not live.',
                    })
                    return
                }
                const session = await requireSession(req, res)
                if (!session) return
                if (path === '/api/kyc' && method === 'GET') {
                    sendJson(res, 200, await ports.kyc.getStatus(session.user.id))
                    return
                }
                if (path === '/api/kyc/nin' && method === 'POST') {
                    const body = await parseJsonBody(req)
                    sendJson(res, 200, await ports.kyc.verifyNin(session.user.id, body.nin))
                    return
                }
                if (path === '/api/kyc/bvn' && method === 'POST') {
                    const body = await parseJsonBody(req)
                    sendJson(res, 200, await ports.kyc.verifyBvn(session.user.id, body.bvn))
                    return
                }
            }

            sendJson(res, 404, { error: 'not_found' })
        } catch (err) {
            const code = err.code
            if (code === 'INVALID_JSON') {
                sendJson(res, 400, { error: 'invalid_json', message: err.message })
                return
            }
            if (code === 'PAYLOAD_TOO_LARGE') {
                sendJson(res, 413, { error: 'payload_too_large' })
                return
            }
            if (code === 'INVALID_AMOUNT' || code === 'INVALID_HOLD') {
                sendJson(res, 400, { error: code.toLowerCase(), message: err.message })
                return
            }
            if (code === 'INSUFFICIENT_FUNDS' || code === 'INSUFFICIENT_HELD' || code === 'INVALID_STATE') {
                sendJson(res, 409, { error: code.toLowerCase(), message: err.message })
                return
            }
            if (code === 'NOT_FOUND') {
                sendJson(res, 404, { error: 'not_found', message: err.message })
                return
            }
            sendJson(res, 500, { error: 'server_error', message: 'Unexpected error' })
        }
    }

    async function handler(req, res) {
        const path = pathnameOf(req)
        if (path.startsWith('/api/')) {
            await handleApi(req, res)
            return
        }
        sendJson(res, 404, { error: 'not_found' })
    }

    return { handler, handleApi, ports, realSession, kycPort }
}
