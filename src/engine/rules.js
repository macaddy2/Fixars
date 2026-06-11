/**
 * ============================================================================
 *  Fixars Ecosystem Engine — Rules Table  (WHEN → IF → THEN)
 * ============================================================================
 *
 *  THIS TABLE IS THE ALGORITHM. Everything else (state machines, the dispatcher,
 *  effects) exists to execute these rows faithfully. It is the data form of
 *  "View 2 — Event Webbing": every subscription line in that diagram is one
 *  rule here.
 *
 *  Rule shape
 *  ----------
 *    {
 *      id:   'unique.rule.id',           // stable id → used for idempotency keys
 *      on:   EVENTS.SOMETHING,           // WHEN this event is published
 *      guard: (event, store) => boolean, // IF this holds (default: always)
 *      then: [                           // THEN run these effects, in order
 *        { effect: 'effectName', args: { ... } },
 *        ...
 *      ],
 *      compensate?: [                     // optional: undo steps if `then` throws
 *        { effect: 'effectName', args: { ... } },
 *      ],
 *    }
 *
 *  Ordering & atomicity
 *  --------------------
 *  Effects in `then` run sequentially. If one throws, the engine runs this
 *  rule's `compensate` steps (in reverse of what succeeded) and records the
 *  failure — so a half-applied rule never silently corrupts state. Most rules
 *  here are naturally idempotent and need no compensation; the money-moving
 *  ones (escrow, refunds) do.
 *
 *  Determinism / AI-readiness
 *  --------------------------
 *  Every guard below is deterministic today. When AI lands, an AI signal is
 *  injected as just another guard input or as an effect (e.g. an
 *  `aiDueDiligence` effect that writes a risk score a later guard reads). The
 *  table's structure does not change — that is the whole point of doing the
 *  webbing first.
 * ============================================================================
 */

import { EVENTS } from './events.js'
import { conceptFundable, campaignReachedTarget, always } from './guards.js'

/** Short helpers to keep feed/notification copy readable in the table. */
const naira = (n) => `₦${Number(n).toLocaleString('en-NG')}`

/**
 * @typedef {Object} Rule
 * @property {string} id
 * @property {string} on
 * @property {(event:any, store:any)=>boolean} [guard]
 * @property {{effect:string, args?:object}[]} then
 * @property {{effect:string, args?:object}[]} [compensate]
 */

/** @type {Rule[]} */
export const RULES = [
  /* ----- ConceptNexus: a validated concept becomes fundable on vestDen ----- */
  {
    id: 'concept.validated→enable-campaign',
    on: EVENTS.CONCEPT_VALIDATED,
    guard: conceptFundable, // re-check score + KYC at dispatch time
    then: [
      { effect: 'enableCampaignCreation' },
      { effect: 'awardPoints', args: { reason: 'CONCEPT_VALIDATED' } },
      {
        effect: 'postToFeed',
        args: { app: 'conceptnexus', text: (p) => `“${p.title}” was validated (${p.score}/100) and is ready for vestDen.` },
      },
      {
        effect: 'notify',
        args: { toField: 'ownerId', text: (p) => `Your concept “${p.title}” passed validation — you can now launch a campaign.` },
      },
    ],
  },

  /* ----- vestDen: a funded campaign spins up execution + escrow ------------ */
  {
    id: 'campaign.funded→create-room+escrow',
    on: EVENTS.CAMPAIGN_FUNDED,
    guard: campaignReachedTarget, // never create the room unless target truly met
    then: [
      { effect: 'createProjectRoom' },
      { effect: 'buildEscrowSchedule' },
      { effect: 'awardPoints', args: { reason: 'CAMPAIGN_FUNDED', userId: 'founderId' } },
      {
        effect: 'notify',
        args: { toField: 'investorIds', text: (p) => `Campaign fully funded at ${naira(p.raised)} — execution has begun.` },
      },
      {
        effect: 'postToFeed',
        args: { app: 'vestden', text: (p) => `A campaign just hit its ${naira(p.target)} target.` },
      },
    ],
    // If room/escrow setup fails partway, there is nothing to "undo" yet (both
    // effects are idempotent and create-or-noop), so no compensation needed.
  },

  /* ----- vestDen: an UNfunded campaign refunds its backers (saga) ---------- */
  {
    id: 'campaign.failed→refund',
    on: EVENTS.CAMPAIGN_FAILED,
    guard: always,
    then: [
      { effect: 'refundInvestors' },
      {
        effect: 'notify',
        args: { toField: 'investorIds', text: () => `A campaign you backed didn't reach its target — your stake has been refunded.` },
      },
    ],
  },

  /* ----- CollaBoard → escrow + SkillsCanvas + conviction (the big fan-out) -- */
  {
    id: 'milestone.verified→release+proof+market',
    on: EVENTS.MILESTONE_VERIFIED,
    guard: always, // approval already gated the state transition
    then: [
      { effect: 'releaseEscrowTranche' }, // money: idempotent + saga-protected
      { effect: 'addProofPoints' }, // → SkillsCanvas delivery proof for contributors
      { effect: 'awardPoints', args: { reason: 'MILESTONE_VERIFIED', userId: 'founderId' } },
      { effect: 'resolveConvictionMarket', args: { outcome: 'YES' } }, // staker market settles YES
      {
        effect: 'notify',
        args: { toField: 'contributorIds', text: () => `A milestone you delivered was verified — proof points added.` },
      },
    ],
    // Compensation: if proof/market steps blow up *after* releasing escrow, we do
    // NOT claw back a legitimately released tranche (that would be wrong). The
    // release effect is idempotent, so a retry of the whole rule is safe — which
    // is why no compensation reverses the money here.
  },

  /* ----- CollaBoard: a missed milestone settles the market NO + flags risk -- */
  {
    id: 'milestone.missed→market-no+risk',
    on: EVENTS.MILESTONE_MISSED,
    guard: always,
    then: [
      { effect: 'resolveConvictionMarket', args: { outcome: 'NO' } },
      { effect: 'flagRisk' },
    ],
  },

  /* ----- SkillsCanvas: completed engagement feeds points + delivery score --- */
  {
    id: 'engagement.completed→points+delivery',
    on: EVENTS.ENGAGEMENT_COMPLETED,
    guard: always,
    then: [
      { effect: 'awardPoints', args: { reason: 'ENGAGEMENT_COMPLETED', userId: 'talentId' } },
      { effect: 'updateReputation', args: { userIdField: 'talentId', delta: 5 } },
    ],
  },
]

/**
 * Index rules by event name once, so dispatch is O(#rules-for-this-event)
 * rather than scanning the whole table on every event.
 * @returns {Map<string, Rule[]>}
 */
export function indexRules(rules = RULES) {
  const byEvent = new Map()
  for (const rule of rules) {
    if (!byEvent.has(rule.on)) byEvent.set(rule.on, [])
    byEvent.get(rule.on).push(rule)
  }
  return byEvent
}
