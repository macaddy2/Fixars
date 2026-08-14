const WEAK_DEFAULTS = new Set([
    'dev',
    'secret',
    'changeme',
    'password',
    'session',
    'fixars',
    'default',
    '123456',
    '1234567890',
])

const MIN_LENGTH = 16

/**
 * Mock login may accept any email/password. The issuer still must not
 * boot with a missing or known-weak SESSION_SECRET — that cookie signs
 * the session, not live money.
 */
export function assertSessionSecret(secret) {
    const value = String(secret || '').trim()
    if (!value) {
        const err = new Error('SESSION_SECRET is required when REAL_SESSION=1')
        err.code = 'WEAK_SESSION_SECRET'
        throw err
    }
    if (value.length < MIN_LENGTH) {
        const err = new Error(`SESSION_SECRET is too short (min ${MIN_LENGTH}). Refusing to boot.`)
        err.code = 'WEAK_SESSION_SECRET'
        throw err
    }
    if (WEAK_DEFAULTS.has(value.toLowerCase())) {
        const err = new Error('SESSION_SECRET is a known-weak default. Refusing to boot.')
        err.code = 'WEAK_SESSION_SECRET'
        throw err
    }
    return value
}

/** Secure cookie when COOKIE_SECURE=1 or the request is HTTPS. */
export function cookieShouldBeSecure(req, { secureCookie = false } = {}) {
    if (secureCookie) return true
    const proto = req?.headers?.['x-forwarded-proto']
    if (proto && String(proto).split(',')[0].trim() === 'https') return true
    if (req?.socket?.encrypted) return true
    return false
}
