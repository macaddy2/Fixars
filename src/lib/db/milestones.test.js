import { describe, it, expect } from 'vitest'
import { validateTrancheSchedule } from './milestones'

describe('validateTrancheSchedule', () => {
    it('accepts schedules within the raised amount', () => {
        const r = validateTrancheSchedule(100000, [{ tranche: 40000 }, { tranche: 60000 }])
        expect(r.valid).toBe(true)
        expect(r.committed).toBe(100000)
        expect(r.remaining).toBe(0)
    })

    it('rejects schedules exceeding escrow', () => {
        const r = validateTrancheSchedule(50000, [{ tranche: 30000 }, { tranche: 30000 }])
        expect(r.valid).toBe(false)
    })

    it('handles empty schedules and coerces numerics', () => {
        const r = validateTrancheSchedule('25000', [])
        expect(r.committed).toBe(0)
        expect(r.remaining).toBe(25000)
        expect(r.valid).toBe(true)
    })

    it('treats missing tranches as zero without crashing', () => {
        const r = validateTrancheSchedule(1000, [{ tranche: null }, {}])
        expect(r.committed).toBe(0)
        expect(r.valid).toBe(true)
    })
})
