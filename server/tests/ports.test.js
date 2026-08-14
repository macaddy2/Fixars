import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertPort, PORT_METHODS } from '../ports.js'
import { createMemorySessionStore } from '../adapters/memory-session-store.js'
import { createMockWalletLedger } from '../adapters/mock-wallet-ledger.js'
import { createMockEscrowHold } from '../adapters/mock-escrow-hold.js'
import { createMockKycProvider } from '../adapters/mock-kyc-provider.js'
import { signSessionId, verifySessionCookie } from '../signed-cookie.js'

test('mock adapters satisfy the published ports', () => {
    const ledger = createMockWalletLedger()
    assertPort('SessionStore', createMemorySessionStore())
    assertPort('WalletLedger', ledger)
    assertPort('EscrowHold', createMockEscrowHold({ ledger }))
    assertPort('KycProvider', createMockKycProvider())
    assert.deepEqual(Object.keys(PORT_METHODS), ['SessionStore', 'WalletLedger', 'EscrowHold', 'KycProvider'])
})

test('assertPort rejects an incomplete adapter', () => {
    assert.throws(() => assertPort('WalletLedger', { getSnapshot() {} }), /missing credit/)
})

test('SessionStore issues ids the caller did not supply', async () => {
    const store = createMemorySessionStore()
    const created = await store.create({ id: 'usr_1', email: 'a@b.c', name: 'A' })
    assert.ok(created.id.length >= 32)
    assert.notEqual(created.id, 'usr_1')
    assert.deepEqual((await store.get(created.id)).user, { id: 'usr_1', email: 'a@b.c', name: 'A' })
    await store.destroy(created.id)
    assert.equal(await store.get(created.id), null)
})

test('signed cookie cannot be minted without the server secret', () => {
    const token = signSessionId('abc', 'server-secret')
    assert.equal(verifySessionCookie(token, 'server-secret'), 'abc')
    assert.equal(verifySessionCookie(token, 'wrong-secret'), null)
    assert.equal(verifySessionCookie('abc.forged', 'server-secret'), null)
    assert.equal(verifySessionCookie('not-a-token', 'server-secret'), null)
})

test('WalletLedger mock is the source of naira figures', async () => {
    const ledger = createMockWalletLedger()
    const opened = await ledger.getSnapshot('usr_1')
    assert.equal(opened.available, 0)
    assert.equal(opened.source, 'mock-ledger')
    assert.equal(opened.liveRails, false)

    const credited = await ledger.credit('usr_1', 10000, { label: 'Seed' })
    assert.equal(credited.available, 10000)

    const paid = await ledger.payout('usr_1', 2500)
    assert.equal(paid.available, 7500)
    assert.equal(paid.entries[0].type, 'payout')

    await assert.rejects(() => ledger.debit('usr_1', 99999), /exceeds available/)
})

test('EscrowHold mock moves funds through the ledger interface', async () => {
    const ledger = createMockWalletLedger()
    const escrow = createMockEscrowHold({ ledger })
    await ledger.credit('usr_1', 8000)

    const held = await escrow.hold({ userId: 'usr_1', amount: 3000, ref: 'm1' })
    assert.equal(held.liveRails, false)
    assert.equal(held.status, 'held')
    assert.equal((await ledger.getSnapshot('usr_1')).available, 5000)
    assert.equal((await ledger.getSnapshot('usr_1')).held, 3000)

    await escrow.release(held.id)
    const after = await ledger.getSnapshot('usr_1')
    assert.equal(after.available, 8000)
    assert.equal(after.held, 0)
    assert.equal((await escrow.list('usr_1'))[0].status, 'released')
})

test('KycProvider mock never claims a live NIMC check', async () => {
    const kyc = createMockKycProvider()
    const status = await kyc.getStatus('usr_1')
    assert.equal(status.provider, 'mock')
    assert.equal(status.liveNetwork, false)
    assert.equal(status.status, 'unverified')
    assert.match(status.note, /Mock adapter only/)
    assert.doesNotMatch(JSON.stringify(status), /checked against NIMC database/i)

    const started = await kyc.startVerification('usr_1', { nin: '12345678901' })
    assert.equal(started.liveNetwork, false)
    assert.equal(started.status, 'pending_mock')
})
