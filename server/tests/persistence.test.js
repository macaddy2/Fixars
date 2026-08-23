import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertPort } from '../ports.js'
import { createPorts, createFilePorts, createMockPorts } from '../persistence.js'
import { startTestServer, request, login } from './helpers.js'

async function tempDataDir(t) {
    const dataDir = await mkdtemp(join(tmpdir(), 'fixars-persist-'))
    t.after(() => rm(dataDir, { recursive: true, force: true }))
    return dataDir
}

test('createPorts defaults to in-memory (unit-test default)', async () => {
    const ports = createPorts()
    const created = await ports.sessions.create({ id: 'usr_mem', email: 'mem@test', name: 'Mem' })
    const again = createMockPorts()
    assert.equal(await again.sessions.get(created.id), null)
})

test('file adapters satisfy the published ports', async (t) => {
    const dataDir = await tempDataDir(t)
    const ports = createFilePorts({ dataDir })
    assertPort('SessionStore', ports.sessions)
    assertPort('WalletLedger', ports.ledger)
    assertPort('EscrowHold', ports.escrow)
    assertPort('Holder', ports.holder)
    assertPort('KycProvider', ports.kyc)
    const kyc = await ports.kyc.getStatus('usr_1')
    assert.equal(kyc.liveNetwork, false)
    assert.equal(kyc.provider, 'mock')
})

test('file adapters reload the same session, ledger, and holds after a new process image', async (t) => {
    const dataDir = await tempDataDir(t)

    const first = createPorts({ persistence: 'file', dataDir })
    const session = await first.sessions.create({ id: 'usr_ade', email: 'ade@fixars.test', name: 'Ade' })
    await first.ledger.credit('usr_ade', 8000, { label: 'Seed' })
    const hold = await first.escrow.hold({ userId: 'usr_ade', amount: 3000, ref: 'sprint-1' })

    const restarted = createPorts({ persistence: 'file', dataDir })
    const reloaded = await restarted.sessions.get(session.id)
    assert.ok(reloaded, 'session must survive restart')
    assert.equal(reloaded.id, session.id)
    assert.equal(reloaded.user.email, 'ade@fixars.test')
    assert.equal(reloaded.user.id, 'usr_ade')

    const wallet = await restarted.ledger.getSnapshot('usr_ade')
    assert.equal(wallet.available, 5000)
    assert.equal(wallet.held, 3000)
    assert.equal(wallet.source, 'mock-ledger')
    assert.equal(wallet.liveRails, false)
    assert.equal(wallet.entries[0].label, 'Seed')

    const holds = await restarted.escrow.list('usr_ade')
    assert.equal(holds.length, 1)
    assert.equal(holds[0].id, hold.id)
    assert.equal(holds[0].amount, 3000)
    assert.equal(holds[0].status, 'held')
    assert.equal(holds[0].liveRails, false)
    assert.equal(holds[0].holdsClientMoney, false)
    assert.equal(holds[0].holder, 'prototype')
    assert.doesNotMatch(JSON.stringify(holds), /GTBank|Providus|the bank holds/i)
})

test('HTTP session + wallet + escrow survive a server restart on file persistence', async (t) => {
    const dataDir = await tempDataDir(t)

    const first = await startTestServer({
        ports: createPorts({ persistence: 'file', dataDir }),
    })
    const { cookie, json: session } = await login(first.url)
    assert.equal(session.user.email, 'ade@fixars.test')
    await first.app.ports.ledger.credit(session.user.id, 8000, { label: 'Seed' })
    await first.app.ports.escrow.hold({ userId: session.user.id, amount: 3000, ref: 'sprint-1' })
    await first.close()

    const second = await startTestServer({
        ports: createPorts({ persistence: 'file', dataDir }),
    })
    t.after(() => second.close())

    const me = await request(`${second.url}/api/me`, { cookie })
    assert.equal(me.status, 200)
    assert.equal(me.json.user.email, 'ade@fixars.test')
    assert.equal(me.json.user.id, session.user.id)

    const wallet = await request(`${second.url}/api/wallet`, { cookie })
    assert.equal(wallet.status, 200)
    assert.equal(wallet.json.available, 5000)
    assert.equal(wallet.json.held, 3000)
    assert.equal(wallet.json.source, 'mock-ledger')
    assert.equal(wallet.json.liveRails, false)

    const escrow = await request(`${second.url}/api/escrow`, { cookie })
    assert.equal(escrow.status, 200)
    assert.equal(escrow.json.holds[0].amount, 3000)
    assert.equal(escrow.json.holds[0].status, 'held')
    assert.equal(escrow.json.liveRails, false)
    assert.equal(escrow.json.holdsClientMoney, false)
    assert.equal(escrow.json.holder, 'prototype')
    assert.doesNotMatch(JSON.stringify(escrow.json), /GTBank|Providus|the bank holds/i)

    const forged = await request(`${second.url}/api/me`, {
        cookie: 'fixars_session=usr_hacker.not-a-real-hmac',
    })
    assert.equal(forged.status, 401)
})

test('destroyed sessions stay gone after a file-backed restart', async (t) => {
    const dataDir = await tempDataDir(t)
    const first = createFilePorts({ dataDir })
    const session = await first.sessions.create({ id: 'usr_x', email: 'x@y.z', name: 'X' })
    await first.sessions.destroy(session.id)

    const restarted = createFilePorts({ dataDir })
    assert.equal(await restarted.sessions.get(session.id), null)
})
