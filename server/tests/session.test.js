import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApp } from '../app.js'
import { signSessionId } from '../signed-cookie.js'
import { assertSessionSecret, cookieShouldBeSecure } from '../session-secret.js'
import { startTestServer, request, login, TEST_SECRET } from './helpers.js'

test('login issues an httpOnly session cookie the client cannot mint', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const res = await login(srv.url)
    assert.equal(res.status, 200)
    assert.equal(res.json.user.email, 'ade@fixars.test')
    assert.ok(res.cookie, 'Set-Cookie must include fixars_session')

    const header = res.setCookie.find((c) => c.startsWith('fixars_session='))
    assert.match(header, /HttpOnly/i)
    assert.match(header, /SameSite=Lax/i)
    assert.doesNotMatch(header, /fixars_user/)
})

test('GET /me is the source of truth for a valid cookie', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const { cookie } = await login(srv.url)
    const me = await request(`${srv.url}/api/me`, { cookie })
    assert.equal(me.status, 200)
    assert.equal(me.json.user.email, 'ade@fixars.test')
    assert.ok(me.json.user.id.startsWith('usr_'))
})

test('GET /me without a cookie is unauthenticated', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const me = await request(`${srv.url}/api/me`)
    assert.equal(me.status, 401)
    assert.equal(me.json.error, 'unauthenticated')
})

test('forged or client-minted cookie is rejected', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const forged = await request(`${srv.url}/api/me`, {
        cookie: 'fixars_session=usr_hacker.not-a-real-hmac',
    })
    assert.equal(forged.status, 401)

    const unsigned = await request(`${srv.url}/api/me`, {
        cookie: 'fixars_session=deadbeef',
    })
    assert.equal(unsigned.status, 401)

    const wrongSecret = signSessionId('ffffffffffffffffffffffffffffffff', 'some-other-secret')
    const replay = await request(`${srv.url}/api/me`, {
        cookie: `fixars_session=${wrongSecret}`,
    })
    assert.equal(replay.status, 401)
})

test('signed cookie for an unknown session id is rejected', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const orphan = signSessionId('a'.repeat(64), TEST_SECRET)
    const me = await request(`${srv.url}/api/me`, {
        cookie: `fixars_session=${orphan}`,
    })
    assert.equal(me.status, 401)
})

test('POST /me with a fabricated user body does not mint a session', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const minted = await request(`${srv.url}/api/me`, {
        method: 'POST',
        body: { user: { id: 'user-001', email: 'minted@local', name: 'I minted this' } },
    })
    assert.equal(minted.status, 404)

    const me = await request(`${srv.url}/api/me`)
    assert.equal(me.status, 401)
})

test('client-supplied session field on login is ignored', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const res = await request(`${srv.url}/api/session`, {
        method: 'POST',
        body: {
            email: 'ade@fixars.test',
            password: 'x',
            session: { id: 'i-made-this', user: { email: 'root@local' } },
        },
    })
    assert.equal(res.status, 200)
    assert.equal(res.json.user.email, 'ade@fixars.test')
    assert.notEqual(res.json.user.id, 'i-made-this')
})

test('logout destroys the server session', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const { cookie } = await login(srv.url)
    const out = await request(`${srv.url}/api/session`, { method: 'DELETE', cookie })
    assert.equal(out.status, 200)

    const me = await request(`${srv.url}/api/me`, { cookie })
    assert.equal(me.status, 401)
})

test('flag-off server does not issue sessions', async (t) => {
    const srv = await startTestServer({ realSession: false, sessionSecret: TEST_SECRET })
    t.after(() => srv.close())

    const loginRes = await request(`${srv.url}/api/session`, {
        method: 'POST',
        body: { email: 'ade@fixars.test', password: 'x' },
    })
    assert.equal(loginRes.status, 404)
    assert.equal(loginRes.json.error, 'real_session_off')
    assert.equal(loginRes.setCookie.length, 0)

    const health = await request(`${srv.url}/api/health`)
    assert.equal(health.status, 200)
    assert.equal(health.json.realSession, false)
    assert.equal(health.json.liveRails, false)
})

test('flag-on login does not attach live money to the mock issuer', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const { cookie } = await login(srv.url)
    const wallet = await request(`${srv.url}/api/wallet`, { cookie })
    assert.equal(wallet.status, 200)
    assert.equal(wallet.json.available, 0)
    assert.equal(wallet.json.held, 0)
    assert.equal(wallet.json.liveRails, false)
    assert.equal(wallet.json.source, 'mock-ledger')
    assert.deepEqual(wallet.json.entries, [])
})

test('createApp refuses a missing or known-weak SESSION_SECRET when realSession is on', () => {
    for (const sessionSecret of ['', 'dev', 'secret', 'changeme', 'short', 'password']) {
        assert.throws(
            () => createApp({ realSession: true, sessionSecret }),
            (err) => err && err.code === 'WEAK_SESSION_SECRET',
        )
    }
    assert.doesNotThrow(() => createApp({ realSession: true, sessionSecret: TEST_SECRET }))
    assert.doesNotThrow(() => createApp({ realSession: false, sessionSecret: '' }))
})

test('assertSessionSecret rejects empty, short, and known-weak values', () => {
    assert.throws(() => assertSessionSecret(''), (err) => err.code === 'WEAK_SESSION_SECRET')
    assert.throws(() => assertSessionSecret('   '), (err) => err.code === 'WEAK_SESSION_SECRET')
    assert.throws(() => assertSessionSecret('1234567890abcd'), (err) => err.code === 'WEAK_SESSION_SECRET')
    assert.throws(() => assertSessionSecret('SECRET'), (err) => err.code === 'WEAK_SESSION_SECRET')
    assert.equal(assertSessionSecret(TEST_SECRET), TEST_SECRET)
})

test('COOKIE_SECURE=1 sets the Secure flag on the session cookie', async (t) => {
    const srv = await startTestServer({ secureCookie: true })
    t.after(() => srv.close())

    const res = await login(srv.url)
    const header = res.setCookie.find((c) => c.startsWith('fixars_session='))
    assert.match(header, /Secure/i)
})

test('x-forwarded-proto https sets the Secure flag without COOKIE_SECURE', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const res = await request(`${srv.url}/api/session`, {
        method: 'POST',
        body: { email: 'ade@fixars.test', password: 'x', name: 'Ade' },
        headers: { 'x-forwarded-proto': 'https' },
    })
    const header = res.setCookie.find((c) => c.startsWith('fixars_session='))
    assert.match(header, /Secure/i)
})

test('plain HTTP login does not set Secure unless COOKIE_SECURE is on', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const res = await login(srv.url)
    const header = res.setCookie.find((c) => c.startsWith('fixars_session='))
    assert.doesNotMatch(header, /Secure/i)
})

test('cookieShouldBeSecure follows COOKIE_SECURE, forwarded proto, and TLS', () => {
    assert.equal(cookieShouldBeSecure({}, { secureCookie: true }), true)
    assert.equal(cookieShouldBeSecure({ headers: { 'x-forwarded-proto': 'https' } }), true)
    assert.equal(cookieShouldBeSecure({ headers: { 'x-forwarded-proto': 'http, https' } }), false)
    assert.equal(cookieShouldBeSecure({ headers: { 'x-forwarded-proto': 'https, http' } }), true)
    assert.equal(cookieShouldBeSecure({ socket: { encrypted: true } }), true)
    assert.equal(cookieShouldBeSecure({ headers: {} }), false)
})
