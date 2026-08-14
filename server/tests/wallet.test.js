import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startTestServer, request, login } from './helpers.js'

test('GET /api/wallet without a session is 401 — no dummy balance', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const res = await request(`${srv.url}/api/wallet`)
    assert.equal(res.status, 401)
    assert.equal(res.json.error, 'unauthenticated')
    assert.equal(res.json.available, undefined)
})

test('GET /api/wallet returns the server mock ledger via the WalletLedger port', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const { cookie, json: session } = await login(srv.url)
    await srv.app.ports.ledger.credit(session.user.id, 25000, { label: 'Test credit' })

    const wallet = await request(`${srv.url}/api/wallet`, { cookie })
    assert.equal(wallet.status, 200)
    assert.equal(wallet.json.source, 'mock-ledger')
    assert.equal(wallet.json.liveRails, false)
    assert.equal(wallet.json.currency, 'NGN')
    assert.equal(wallet.json.available, 25000)
    assert.equal(wallet.json.held, 0)
    assert.equal(wallet.json.entries[0].label, 'Test credit')
})

test('anonymous localStorage-style numbers are not accepted as a wallet', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const res = await request(`${srv.url}/api/wallet`, {
        method: 'GET',
        headers: { 'X-Fixars-User': JSON.stringify({ email: 'anon@local', available: 284500 }) },
    })
    assert.equal(res.status, 401)
})

test('payout requires a session and stays on the mock ledger', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    const denied = await request(`${srv.url}/api/wallet/payout`, {
        method: 'POST',
        body: { amount: 1000, destination: '0123456789' },
    })
    assert.equal(denied.status, 401)

    const { cookie, json: session } = await login(srv.url)
    await srv.app.ports.ledger.credit(session.user.id, 5000, { label: 'Seed' })

    const paid = await request(`${srv.url}/api/wallet/payout`, {
        method: 'POST',
        cookie,
        body: { amount: 1500, destination: '0123456789' },
    })
    assert.equal(paid.status, 200)
    assert.equal(paid.json.available, 3500)
    assert.equal(paid.json.liveRails, false)
    assert.match(paid.json.entries[0].label, /no live processor/i)
})

test('escrow and KYC routes require a session and stay mock', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())

    assert.equal((await request(`${srv.url}/api/escrow`)).status, 401)
    assert.equal((await request(`${srv.url}/api/kyc`)).status, 401)

    const { cookie, json: session } = await login(srv.url)
    await srv.app.ports.ledger.credit(session.user.id, 100, { label: 'Escrow seed' })
    await srv.app.ports.escrow.hold({ userId: session.user.id, amount: 100, ref: 'sprint-1' })

    const escrow = await request(`${srv.url}/api/escrow`, { cookie })
    assert.equal(escrow.status, 200)
    assert.equal(escrow.json.liveRails, false)
    assert.equal(escrow.json.provider, 'mock')
    assert.equal(escrow.json.holds[0].amount, 100)

    const kyc = await request(`${srv.url}/api/kyc`, { cookie })
    assert.equal(kyc.status, 200)
    assert.equal(kyc.json.liveNetwork, false)
    assert.equal(kyc.json.provider, 'mock')
    assert.doesNotMatch(JSON.stringify(kyc.json), /checked against NIMC database/i)
})
