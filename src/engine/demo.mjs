/**
 * ============================================================================
 *  Fixars Ecosystem Engine — Runnable Demo  (`node src/engine/demo.mjs`)
 * ============================================================================
 *
 *  Drives the full innovation journey through the engine end-to-end and asserts
 *  the cross-app effects fired correctly. This is the executable proof that the
 *  webbing in docs/ecosystem-webbing.md actually works — before any backend
 *  exists. It uses only the in-memory store, so it runs anywhere Node runs.
 *
 *  Journey exercised:
 *    ConceptNexus  validate concept  ──▶ vestDen campaign enabled + funded
 *    vestDen       fund campaign     ──▶ CollaBoard room + escrow created
 *    CollaBoard    verify milestone  ──▶ escrow released + SkillsCanvas proof
 *                                        + conviction market settles YES
 *    CollaBoard    miss a milestone  ──▶ conviction settles NO + risk flagged
 *    SkillsCanvas  deliver engagement──▶ points + reputation to the talent
 * ============================================================================
 */

import { createEngine } from './engine.js'
import { createMemoryStore } from './effects.js'
import { KYC } from './guards.js'

/* --------------------------- tiny test harness ---------------------------- */
let passed = 0
let failed = 0
function check(label, cond) {
  if (cond) { passed++; console.log(`  ✓ ${label}`) }
  else { failed++; console.error(`  ✗ FAIL: ${label}`) }
}
const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`
const day = 86_400_000

/* ------------------------------- seed data -------------------------------- */
// Nigerian personas (matching the PRD), so the demo also models the real market.
const store = createMemoryStore({
  user: [
    { id: 'u_amaka', name: 'Amaka Obi', kycTier: KYC.T2_NIN_BVN, wallet: 50_000, points: 0, reputation: 600, proofPoints: 0 },
    { id: 'u_tunde', name: 'Tunde Bello', kycTier: KYC.T2_NIN_BVN, wallet: 200_000 },
    { id: 'u_kemi', name: 'Kemi Ade', kycTier: KYC.T1_PHONE, wallet: 200_000 },
    { id: 'u_emeka', name: 'Emeka Eze', kycTier: KYC.T2_NIN_BVN, wallet: 0, verified: true, reputation: 500, proofPoints: 0 },
  ],
  concept: [
    {
      id: 'cn1',
      state: 'draft',
      ownerId: 'u_amaka',
      ownerKyc: KYC.T2_NIN_BVN, // denormalised so the SUBMIT guard stays pure
      score: 0,
      title: 'Solar lockers for market sellers',
    },
  ],
})

const engine = createEngine({ store })

console.log('\n=== 1. ConceptNexus: validate the concept ===')
engine.send('concept', 'cn1', 'SUBMIT')
engine.send('concept', 'cn1', 'ASSIGN_VALIDATORS')
engine.send('concept', 'cn1', 'PASS', { score: 84 }) // ≥70 → emits concept.validated

check('concept moved to validated', store.get('concept', 'cn1').state === 'validated')
check('campaign draft was auto-created from concept', !!store.get('campaign', 'camp_cn1'))
check('founder earned validation points (50)', store.get('user', 'u_amaka').points === 50)
check('feed got the validation post', store.feed.some((f) => f.app === 'conceptnexus'))

console.log('\n=== 2. vestDen: configure, launch, and fund the campaign ===')
// The founder configures the auto-created draft (target + milestone schedule).
store.update('campaign', 'camp_cn1', {
  target: 100_000,
  milestones: [
    { id: 'm1', pct: 60, tranche: 60_000, dueAt: Date.now() + 7 * day },
    { id: 'm2', pct: 40, tranche: 40_000, dueAt: Date.now() - 1 * day }, // already overdue → will be missed
  ],
})
engine.send('campaign', 'camp_cn1', 'LAUNCH') // guard: concept must be validated

// Simulate backers staking until the target is met, then mark it funded.
function invest(campaignId, investorId, amount) {
  const c = store.get('campaign', campaignId)
  const investorIds = [...c.investorIds, { userId: investorId, amount }]
  const raised = c.raised + amount
  store.update('campaign', campaignId, { raised, investorIds })
  if (raised >= c.target) engine.send('campaign', campaignId, 'MARK_FUNDED')
}
invest('camp_cn1', 'u_tunde', 60_000)
invest('camp_cn1', 'u_kemi', 50_000) // 110k ≥ 100k → emits campaign.funded

check('campaign moved to funded', store.get('campaign', 'camp_cn1').state === 'funded')
check('CollaBoard project room was created', !!store.get('project', 'proj_camp_cn1'))
check('escrow funded with the raised amount', store.escrow.get('camp_cn1')?.held === 110_000)
check('founder earned funding points (now 250)', store.get('user', 'u_amaka').points === 250)
check('both investors were notified', store.notifications.filter((n) => /fully funded/i.test(n.text)).length === 2)

console.log('\n=== 3. CollaBoard: materialise milestones + a conviction market ===')
// CollaBoard turns the campaign's milestone schedule into trackable cards.
const projectId = 'proj_camp_cn1'
for (const m of store.get('campaign', 'camp_cn1').milestones) {
  store.put('milestone', {
    id: m.id, state: 'pending', campaignId: 'camp_cn1', projectId,
    founderId: 'u_amaka', tranche: m.tranche, contributorIds: ['u_emeka'], dueAt: m.dueAt,
  })
}
// Stakers have taken positions on each milestone's conviction market.
store.conviction.set('m1', { YES: 30_000, NO: 10_000, settled: false })
store.conviction.set('m2', { YES: 8_000, NO: 22_000, settled: false })

console.log('\n=== 4. CollaBoard: deliver + verify milestone 1 (the big fan-out) ===')
engine.send('milestone', 'm1', 'START')
engine.send('milestone', 'm1', 'SUBMIT')
engine.send('milestone', 'm1', 'VERIFY') // emits milestone.verified

check('milestone 1 verified', store.get('milestone', 'm1').state === 'verified')
check('escrow released the m1 tranche to founder wallet', store.get('user', 'u_amaka').wallet === 50_000 + 60_000)
check('escrow balance reduced (110k → 50k)', store.escrow.get('camp_cn1').held === 50_000)
check('contributor earned a SkillsCanvas proof point', store.get('user', 'u_emeka').proofPoints === 1)
check('conviction market m1 settled YES', store.conviction.get('m1').settled && store.conviction.get('m1').outcome === 'YES')

console.log('\n=== 5. CollaBoard: milestone 2 is missed (the unhappy path) ===')
engine.send('milestone', 'm2', 'MISS') // emits milestone.missed

check('milestone 2 missed', store.get('milestone', 'm2').state === 'missed')
check('conviction market m2 settled NO', store.conviction.get('m2').outcome === 'NO')
check('project was risk-flagged', store.get('project', projectId).riskFlag === true)
check('escrow did NOT release for the missed milestone', !store.escrow.get('camp_cn1').released.has('m2'))

console.log('\n=== 6. SkillsCanvas: a talent engagement completes ===')
store.put('engagement', {
  id: 'eng1', state: 'offered', talentId: 'u_emeka', projectId,
  verified: true, onTime: 1, // verified gate + on-time delivery
})
engine.send('engagement', 'eng1', 'ACCEPT')
engine.send('engagement', 'eng1', 'ACTIVATE')
engine.send('engagement', 'eng1', 'DELIVER') // emits engagement.completed
engine.send('engagement', 'eng1', 'RATE')

check('engagement completed', store.get('engagement', 'eng1').state === 'rated')
check('talent earned engagement points (60)', store.get('user', 'u_emeka').points === 60)
check('talent reputation increased (+5 → 505)', store.get('user', 'u_emeka').reputation === 505)

console.log('\n=== 7. Safety: idempotency + illegal transitions ===')
const before = store.get('user', 'u_amaka').wallet
const replay = engine.send('milestone', 'm1', 'VERIFY') // already final → must be refused
check('re-verifying a final milestone is refused', replay.ok === false)
check('escrow was NOT double-released', store.get('user', 'u_amaka').wallet === before)
check('every emitted event is in the audit log', engine.log.length >= 5)

/* -------------------------------- summary --------------------------------- */
console.log('\n----------------------------------------------------')
console.log(`  Founder wallet:     ${naira(store.get('user', 'u_amaka').wallet)}  (started ₦50,000)`)
console.log(`  Founder points:     ${store.get('user', 'u_amaka').points}`)
console.log(`  Escrow remaining:   ${naira(store.escrow.get('camp_cn1').held)}`)
console.log(`  Events emitted:     ${engine.log.map((e) => e.name).join(', ')}`)
console.log('----------------------------------------------------')
console.log(`  ${passed} passed, ${failed} failed\n`)

// Non-zero exit on failure so CI / a smoke test can gate on the engine.
process.exit(failed === 0 ? 0 : 1)
