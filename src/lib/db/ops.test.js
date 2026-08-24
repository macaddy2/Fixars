import { describe, it, expect } from 'vitest'
import { computeFee, normalizeEscrowEvent } from './ops'
import { normalizeEscrowEvent as ledgerNormalize } from '@/lib/ledger'

describe('computeFee (bps of tranche)', () => {
    it('zero bps means no platform fee', () => {
        expect(computeFee(10000, 0)).toBe(0)
        expect(computeFee(10000)).toBe(0)
    })

    it('200 bps = 2% of the tranche', () => {
        expect(computeFee(25000, 200)).toBe(500)
    })

    it('rounds to whole units and survives junk input', () => {
        expect(computeFee(3333, 150)).toBe(50) // 49.995 → 50
        expect(computeFee(undefined, 200)).toBe(0)
        expect(computeFee(1000, 'x')).toBe(0)
    })
})

describe('escrow event normalization', () => {
    const ev = {
        event_id: 'ev-1',
        campaign_id: 'camp-9',
        campaign_title: 'Solar Grid',
        milestone_id: null,
        type: 'release',
        amount: 4800,
        created_at: '2026-06-01T00:00:00Z',
    }

    it('ops layer maps raw RPC rows', () => {
        expect(normalizeEscrowEvent(ev)).toMatchObject({
            id: 'ev-1',
            campaignId: 'camp-9',
            campaignTitle: 'Solar Grid',
            type: 'release',
            amount: 4800,
        })
    })

    it('ledger adapter shapes it for the Decision Log', () => {
        const row = ledgerNormalize(normalizeEscrowEvent(ev))
        expect(row.source).toBe('escrow')
        expect(row.amount).toBe(4800)
        expect(row.reason).toContain('Escrow tranche released')
        expect(row.reason).toContain('Solar Grid')
    })

    it('unknown types still render without crashing', () => {
        const row = ledgerNormalize(normalizeEscrowEvent({ ...ev, type: 'weird' }))
        expect(row.reason).toContain('Escrow movement')
    })
})
