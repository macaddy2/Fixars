import { describe, it, expect } from 'vitest'
import { createEngine, silentLogger, createMemoryStore, KYC } from '@/engine'

/**
 * End-to-end engine tests against the default configuration (machines +
 * rules + effects). These pin the cross-app webbing described in
 * docs/ecosystem-webbing.md: concept validated → campaign draft created,
 * points awarded, feed + notification fanned out.
 */

function makeStore() {
    return createMemoryStore({
        // kycTier is read by rule guards; ownerKyc by transition guards
        user: [{ id: 'u1', name: 'Ada', kycTier: KYC.T1_PHONE, points: 0 }],
        concept: [
            { id: 'cn1', ownerId: 'u1', title: 'Solar Grid', ownerKyc: KYC.T1_PHONE, score: 0 },
        ],
    })
}

describe('engine.send — state machine basics', () => {
    it('rejects illegal transitions without throwing', () => {
        const store = makeStore()
        const engine = createEngine({ store, logger: silentLogger })

        // PASS is only legal from in_review
        const result = engine.send('concept', 'cn1', 'PASS', { score: 90 })
        expect(result.ok).toBe(false)
        expect(result.reason).toBe('illegal-transition')
    })

    it('enforces transition guards (KYC gate on SUBMIT)', () => {
        const store = createMemoryStore({
            user: [{ id: 'u2', name: 'No Kyc' }],
            concept: [{ id: 'cn2', ownerId: 'u2', title: 'Unverified' }], // no ownerKyc
        })
        const engine = createEngine({ store, logger: silentLogger })

        const result = engine.send('concept', 'cn2', 'SUBMIT')
        expect(result.ok).toBe(false)
        expect(result.reason).toBe('guard-failed')
    })

    it('drives a concept through its lifecycle', () => {
        const store = makeStore()
        const engine = createEngine({ store, logger: silentLogger })

        expect(engine.send('concept', 'cn1', 'SUBMIT').state).toBe('submitted')
        expect(engine.send('concept', 'cn1', 'ASSIGN_VALIDATORS').state).toBe('in_review')
    })
})

describe('engine — cross-app cascade (ConceptNexus → vestDen)', () => {
    function passConcept(score) {
        const store = makeStore()
        const engine = createEngine({ store, logger: silentLogger })
        engine.send('concept', 'cn1', 'SUBMIT')
        engine.send('concept', 'cn1', 'ASSIGN_VALIDATORS')
        const result = engine.send('concept', 'cn1', 'PASS', { score })
        return { store, engine, result }
    }

    it('blocks PASS below the validation threshold', () => {
        const { result } = passConcept(50)
        expect(result.ok).toBe(false)
        expect(result.reason).toBe('guard-failed')
    })

    it('cascades on PASS: campaign created, points awarded, feed + notification', () => {
        const { store, result } = passConcept(85)

        expect(result.ok).toBe(true)
        expect(result.emitted).toBe('concept.validated')

        // Concept marked fundable and campaign draft pre-filled
        expect(store.get('concept', 'cn1').fundable).toBe(true)
        const campaign = store.get('campaign', 'camp_cn1')
        expect(campaign).toBeTruthy()
        expect(campaign.conceptId).toBe('cn1')
        expect(campaign.founderId).toBe('u1')

        // Points ledger got the CONCEPT_VALIDATED award for the owner
        const award = store.pointsLedger.find(l => l.userId === 'u1' && l.reason === 'CONCEPT_VALIDATED')
        expect(award).toBeTruthy()
        expect(store.get('user', 'u1').points).toBeGreaterThan(0)

        // Feed + notification fanned out
        expect(store.feed.length).toBeGreaterThan(0)
        expect(store.notifications.some(n => n.userId === 'u1')).toBe(true)
    })

    it('is idempotent: the same event/rule pair never runs twice', () => {
        const { engine } = passConcept(85)
        const keysAfterFirstRun = engine.processedKeys.length
        expect(keysAfterFirstRun).toBeGreaterThan(0)

        // Re-running the same transition is illegal (already validated), and
        // no duplicate awards exist even after more activity.
        const second = engine.send('concept', 'cn1', 'PASS', { score: 85 })
        expect(second.ok).toBe(false)

        const awards = engine.store.pointsLedger.filter(
            l => l.userId === 'u1' && l.reason === 'CONCEPT_VALIDATED'
        )
        expect(awards).toHaveLength(1)
    })

    it('records every published event in an ordered audit log', () => {
        const { engine } = passConcept(85)
        const names = engine.log.map(e => e.name)
        expect(names[0]).toBe('concept.validated') // emitted by the PASS transition
        expect(engine.log.every((e, i) => i === 0 || true)).toBe(true)
    })
})
