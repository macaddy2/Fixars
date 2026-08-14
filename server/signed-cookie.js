import { createHmac, timingSafeEqual } from 'node:crypto'

const COOKIE_NAME = 'fixars_session'

export function cookieName() {
    return COOKIE_NAME
}

export function signSessionId(sessionId, secret) {
    if (!sessionId || !secret) throw new Error('session id and secret are required')
    const mac = createHmac('sha256', secret).update(sessionId).digest('base64url')
    return `${sessionId}.${mac}`
}

export function verifySessionCookie(token, secret) {
    if (!token || !secret || typeof token !== 'string') return null
    const dot = token.lastIndexOf('.')
    if (dot <= 0) return null
    const sessionId = token.slice(0, dot)
    const mac = token.slice(dot + 1)
    if (!sessionId || !mac) return null
    const expected = createHmac('sha256', secret).update(sessionId).digest('base64url')
    const a = Buffer.from(mac)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    return sessionId
}

export function serializeSessionCookie(value, { maxAgeSec, secure = false } = {}) {
    const parts = [
        `${COOKIE_NAME}=${value}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Lax',
    ]
    if (maxAgeSec != null) parts.push(`Max-Age=${maxAgeSec}`)
    if (secure) parts.push('Secure')
    return parts.join('; ')
}

export function clearSessionCookie({ secure = false } = {}) {
    return serializeSessionCookie('', { maxAgeSec: 0, secure })
}

export function readCookie(header, name = COOKIE_NAME) {
    if (!header) return null
    const parts = String(header).split(';')
    for (const part of parts) {
        const trimmed = part.trim()
        const eq = trimmed.indexOf('=')
        if (eq === -1) continue
        if (trimmed.slice(0, eq) === name) return trimmed.slice(eq + 1)
    }
    return null
}
