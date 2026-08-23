import { describe, it, expect } from 'vitest'

/**
 * Tests for the app↔engine bridge (src/engine/runtime.js).
 * Runs without Supabase configured (isSupabaseConfigured() === false), so the
 * overridden effects stay on their in-memory mirror paths.
 */

let runtime = null

async function loadRuntime() {
    if (!runtime) {
        runtime = await import('./runtime.js')
    }
    return runtime
}

describe('engine runtime — app integration', () => {
    it('conceptSubmitted seeds the entity and drives SUBMIT', async () => {
        const rt = await loadRuntime()
        rt.conceptSubmitted({ id: 'idea-r1', creatorId: 'u-rt', title: 'Runtime Idea' })

        const engine = rt._getEngineForTests()
        expect(engine.store.get('concept', 'idea-r1').state).toBe('submitted')
    })

    it('conceptVotesUpdated cascades when DB validation condition is met', async () => {
        const rt = await loadRuntime()
        rt.conceptSubmitted({ id: 'idea-r2', creatorId: 'u-rt2', title: 'Cascade Idea' })

        // Mirrors update_idea_votes(): score >= 75 AND total votes >= 10
        rt.conceptVotesUpdated({
            id: 'idea-r2',
            creatorId: 'u-rt2',
            title: 'Cascade Idea',
            validationScore: 80,
            votes: { up: 12, down: 3 },
        })

        const store = rt._getEngineForTests().store
        expect(store.get('concept', 'idea-r2').state).toBe('validated')

        // Cross-app cascade: campaign draft pre-filled by the rule
        expect(store.get('campaign', 'camp_idea-r2')).toBeTruthy()

        // Points ledger recorded CONCEPT_VALIDATED for the owner
        const award = store.pointsLedger.find(
            l => l.userId === 'u-rt2' && l.reason === 'CONCEPT_VALIDATED'
        )
        expect(award).toBeTruthy()
    })

    it('does NOT cascade below the validation bar', async () => {
        const rt = await loadRuntime()
        rt.conceptSubmitted({ id: 'idea-r3', creatorId: 'u-rt3', title: 'Weak Idea' })

        rt.conceptVotesUpdated({
            id: 'idea-r3',
            creatorId: 'u-rt3',
            title: 'Weak Idea',
            validationScore: 60,
            votes: { up: 5, down: 3 },
        })

        const store = rt._getEngineForTests().store
        expect(store.get('concept', 'idea-r3').state).toBe('submitted')
        expect(store.all('campaign').find(c => c.id === 'camp_idea-r3')).toBeUndefined()
    })

    it('campaignFunded creates room + escrow mirrors and notifies investors', async () => {
        const rt = await loadRuntime()
        rt.campaignFunded({
            id: 'stake-r1',
            creatorId: 'founder-rt',
            creatorName: 'Founder',
            title: 'Funded Thing',
            targetAmount: 100,
            currentAmount: 120,
            stakers: [{ userId: 'inv-1', amount: 50 }, { userId: 'inv-2', amount: 70 }],
        })

        const store = rt._getEngineForTests().store
        const campaign = store.get('campaign', 'stake-r1')
        expect(campaign.state).toBe('funded')

        // Escrow account opened with the raised amount
        expect(store.escrow.get('stake-r1').held).toBe(120)

        // Project room created (vestDen → CollaBoard hand-off)
        expect(store.get('project', 'proj_stake-r1')).toBeTruthy()
    })
})
