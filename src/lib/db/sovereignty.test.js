import { describe, it, expect } from 'vitest'
import { nextKycStep, KYC_LABELS } from './sovereignty'

describe('nextKycStep', () => {
    it('unverified users can self-serve phone verification', () => {
        const s = nextKycStep(0)
        expect(s.action).toBe('phone')
        expect(s.selfServe).toBe(true)
    })

    it('tier-1 users need a compliance-port reference for NIN/BVN', () => {
        const s = nextKycStep(1)
        expect(s.needsRef).toBe(true)
        expect(s.selfServe).toBe(true)
    })

    it('tier-2+ requires an operator', () => {
        expect(nextKycStep(2).selfServe).toBe(false)
        expect(nextKycStep(3).action).toBe('done')
    })
})

describe('KYC_LABELS', () => {
    it('covers every tier 0..3', () => {
        for (const t of [0, 1, 2, 3]) expect(KYC_LABELS[t]).toBeTruthy()
    })
})
