import { describe, it, expect } from 'vitest'
import { reputationDelta, isOnTime } from './engagements'

describe('reputationDelta', () => {
    it('rewards 4–5 star ratings', () => {
        expect(reputationDelta(5)).toBe(5)
        expect(reputationDelta(4)).toBe(5)
    })

    it('is neutral for 3 stars and penalises 1–2', () => {
        expect(reputationDelta(3)).toBe(0)
        expect(reputationDelta(2)).toBe(-8)
        expect(reputationDelta(1)).toBe(-8)
    })
})

describe('isOnTime', () => {
    const now = new Date('2026-06-15T12:00:00Z')

    it('no due date counts as on time', () => {
        expect(isOnTime(null, now)).toBe(true)
    })

    it('delivery on or before the due date is on time', () => {
        expect(isOnTime('2026-06-15', now)).toBe(true) // same-day boundary
        expect(isOnTime('2026-06-20', now)).toBe(true) // due later
    })

    it('after the due date is late', () => {
        expect(isOnTime('2026-06-14', now)).toBe(false)
    })
})
