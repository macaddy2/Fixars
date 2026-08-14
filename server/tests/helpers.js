import { createServer } from 'node:http'
import { createApp } from '../app.js'

export const TEST_SECRET = 'test-session-secret-not-for-production'

export async function startTestServer(overrides = {}) {
    const app = createApp({
        realSession: true,
        sessionSecret: TEST_SECRET,
        ...overrides,
    })
    const server = createServer(app.handler)
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address()
    return {
        app,
        url: `http://127.0.0.1:${port}`,
        async close() {
            await new Promise((resolve) => server.close(resolve))
        },
    }
}

export async function request(url, { method = 'GET', body, cookie, headers = {} } = {}) {
    const res = await fetch(url, {
        method,
        headers: {
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
            ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const setCookie = typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : (res.headers.get('set-cookie') ? [res.headers.get('set-cookie')] : [])
    const text = await res.text()
    let json = null
    try {
        json = JSON.parse(text)
    } catch {
        json = null
    }
    return { status: res.status, json, setCookie, text }
}

export function sessionCookieFrom(setCookie) {
    const header = setCookie.find((c) => c.startsWith('fixars_session='))
    if (!header) return null
    return header.split(';')[0]
}

export async function login(url, email = 'ade@fixars.test', password = 'not-a-bank-password') {
    const res = await request(`${url}/api/session`, {
        method: 'POST',
        body: { email, password, name: 'Ade' },
    })
    return { ...res, cookie: sessionCookieFrom(res.setCookie) }
}
