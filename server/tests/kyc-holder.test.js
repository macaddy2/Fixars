import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createMockKycProvider } from '../adapters/mock-kyc-provider.js'
import { createMockEscrowHold } from '../adapters/mock-escrow-hold.js'
import { createMockWalletLedger } from '../adapters/mock-wallet-ledger.js'
import { createPorts } from '../persistence.js'
import { startTestServer, request, login } from './helpers.js'

const BANK_NAME = /GTBank|Guaranty Trust|Providus|Access Bank|Zenith|First Bank|UBA|Wema|Kuda|OPay|PalmPay|Moniepoint|the bank holds|funds sit in/i
const LIVE_NIMC = /checked against NIMC database|checked against the NIMC/i

function assertNoBankName(value) {
    assert.doesNotMatch(JSON.stringify(value), BANK_NAME)
}

test('mock KYC never claims liveNetwork or a live NIMC check', async () => {
    const kyc = createMockKycProvider()
    for (const result of [
        await kyc.getStatus('usr_1'),
        await kyc.startVerification('usr_1'),
        await kyc.verifyNin('usr_1', '12345678901'),
        await kyc.verifyBvn('usr_1', '22222222222'),
    ]) {
        assert.equal(result.liveNetwork, false)
        assert.equal(result.provider, 'mock')
        assert.doesNotMatch(JSON.stringify(result), LIVE_NIMC)
        assert.match(result.note, /[Pp]rototype|[Pp]lanned|[Nn]ot live|[Mm]ock/)
    }
})

test('KYC port is flagged off by default', async (t) => {
    const srv = await startTestServer()
    t.after(() => srv.close())
    const { cookie } = await login(srv.url)

    const health = await request(`${srv.url}/api/health`)
    assert.equal(health.json.kycPort, false)

    const kyc = await request(`${srv.url}/api/kyc`, { cookie })
    assert.equal(kyc.status, 404)
    assert.equal(kyc.json.error, 'kyc_port_off')
    assert.equal(kyc.json.liveNetwork, false)
})

test('KYC flag-on still uses the mock NIN/BVN adapter', async (t) => {
    const srv = await startTestServer({ kycPort: true })
    t.after(() => srv.close())
    const { cookie } = await login(srv.url)

    const nin = await request(`${srv.url}/api/kyc/nin`, {
        method: 'POST',
        cookie,
        body: { nin: '12345678901' },
    })
    assert.equal(nin.status, 200)
    assert.equal(nin.json.liveNetwork, false)
    assert.equal(nin.json.channel, 'nin')
    assert.doesNotMatch(JSON.stringify(nin.json), LIVE_NIMC)

    const bvn = await request(`${srv.url}/api/kyc/bvn`, {
        method: 'POST',
        cookie,
        body: { bvn: '22222222222' },
    })
    assert.equal(bvn.status, 200)
    assert.equal(bvn.json.liveNetwork, false)
    assert.equal(bvn.json.channel, 'bvn')
})

test('holder / escrow mock has no bank name and does not hold client money', async () => {
    const ledger = createMockWalletLedger()
    const holder = createMockEscrowHold({ ledger })
    await ledger.credit('usr_1', 4000)
    const held = await holder.hold({ userId: 'usr_1', amount: 1500, ref: 'm1' })
    const info = await holder.info()
    const listed = await holder.list('usr_1')

    assert.equal(held.holder, 'prototype')
    assert.equal(held.holdsClientMoney, false)
    assert.equal(held.intendedAfter, 'licensed-dmb-mmo-letter')
    assert.equal(info.holdsClientMoney, false)
    assert.equal(info.holder, 'prototype')
    assert.match(info.note, /does not hold client money/i)
    assertNoBankName(held)
    assertNoBankName(info)
    assertNoBankName(listed)
})

test('file persistence still reloads holder records without a bank name', async (t) => {
    const dataDir = await mkdtemp(join(tmpdir(), 'fixars-holder-'))
    t.after(() => rm(dataDir, { recursive: true, force: true }))

    const first = createPorts({ persistence: 'file', dataDir })
    await first.ledger.credit('usr_ade', 8000, { label: 'Seed' })
    const hold = await first.holder.hold({ userId: 'usr_ade', amount: 3000, ref: 'sprint-1' })

    const restarted = createPorts({ persistence: 'file', dataDir })
    const holds = await restarted.holder.list('usr_ade')
    const info = await restarted.holder.info()
    assert.equal(holds.length, 1)
    assert.equal(holds[0].id, hold.id)
    assert.equal(holds[0].amount, 3000)
    assert.equal(holds[0].status, 'held')
    assert.equal(holds[0].holdsClientMoney, false)
    assert.equal(holds[0].holder, 'prototype')
    assert.equal(info.holdsClientMoney, false)
    assertNoBankName(holds)
    assertNoBankName(info)
})
