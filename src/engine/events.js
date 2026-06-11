/**
 * ============================================================================
 *  Fixars Ecosystem Engine — Event Catalog
 * ============================================================================
 *
 *  The engine is event-driven: state machines emit *events* (facts that have
 *  happened), and rules subscribe to those events to drive cross-app effects.
 *  This file is the single source of truth for every event name and the shape
 *  of its payload. It corresponds 1:1 to the pills in "View 2 — Event Webbing"
 *  (docs/ecosystem-webbing.md).
 *
 *  Conventions
 *  -----------
 *  - Event names are lowercase, dot-namespaced: `<entity>.<pastTenseFact>`.
 *  - Names are PAST TENSE — an event describes something that already occurred,
 *    never a command. (`milestone.verified`, not `verify.milestone`.)
 *  - Every payload carries enough context for a subscriber to act *without*
 *    re-reading the whole entity, but the entity id is always present so a
 *    subscriber can load more if it needs to.
 *
 *  Adding an event = add a constant here + document its payload typedef.
 *  Nothing in the engine hard-codes string literals; everything imports EVENTS.
 * ============================================================================
 */

/**
 * Canonical event names. Frozen so a typo (`EVENTS.CONCEPT_VALIDATE`) throws at
 * dev time instead of silently subscribing to nothing.
 * @readonly
 */
export const EVENTS = Object.freeze({
  // ConceptNexus
  CONCEPT_VALIDATED: 'concept.validated', // a concept passed validation (score >= threshold)
  CONCEPT_REJECTED: 'concept.rejected',   // a concept failed validation

  // vestDen
  CAMPAIGN_LAUNCHED: 'campaign.launched', // a validated concept opened a funding round
  CAMPAIGN_FUNDED: 'campaign.funded',     // a campaign reached/exceeded its target
  CAMPAIGN_FAILED: 'campaign.failed',     // a campaign closed below target (triggers refunds)

  // CollaBoard / escrow
  MILESTONE_SUBMITTED: 'milestone.submitted', // deliverables attached, awaiting review
  MILESTONE_VERIFIED: 'milestone.verified',   // milestone approved (triggers escrow release)
  MILESTONE_MISSED: 'milestone.missed',       // due date passed without a submission

  // SkillsCanvas
  ENGAGEMENT_COMPLETED: 'engagement.completed', // a talent's task was approved on a project
})

/**
 * The validation threshold a concept must reach to become fundable.
 * Centralised so product can tune it without hunting through rule code.
 * (PRD: ConceptNexus "Validated" status / VestDen browse-by-score.)
 */
export const VALIDATION_THRESHOLD = 70

/**
 * Platform fee applied when a conviction market resolves (vestDen PRD §4.2: 2%).
 * Defined here because both the resolve-market effect and analytics need it.
 */
export const CONVICTION_FEE = 0.02

/* ----------------------------------------------------------------------------
 *  Payload typedefs (documentation only — plain objects at runtime).
 *  Each subscriber can rely on exactly these fields being present.
 * ------------------------------------------------------------------------- */

/**
 * @typedef {Object} ConceptValidatedPayload
 * @property {string} conceptId   - the concept that was validated
 * @property {string} ownerId     - user who owns the concept
 * @property {number} score       - aggregate validation score (0–100)
 * @property {string} title       - concept title, for feed/notification copy
 */

/**
 * @typedef {Object} CampaignFundedPayload
 * @property {string} campaignId  - the funded campaign
 * @property {string} founderId   - user who owns the campaign
 * @property {string} conceptId   - source concept (provenance back to ConceptNexus)
 * @property {number} target      - funding target in kobo/naira
 * @property {number} raised      - amount raised (>= target)
 * @property {Array<{id:string,pct:number,dueAt:number}>} milestones - schedule to escrow
 * @property {string[]} investorIds - backers to notify
 */

/**
 * @typedef {Object} MilestoneVerifiedPayload
 * @property {string} milestoneId - the verified milestone
 * @property {string} campaignId  - parent campaign (to find the escrow account)
 * @property {string} projectId   - parent CollaBoard project
 * @property {number} tranche     - amount to release from escrow
 * @property {string[]} contributorIds - talents who earn proof points
 */

/**
 * @typedef {Object} MilestoneMissedPayload
 * @property {string} milestoneId
 * @property {string} campaignId
 * @property {string} projectId
 */

/**
 * @typedef {Object} EngagementCompletedPayload
 * @property {string} engagementId
 * @property {string} talentId    - whose delivery score / reputation improves
 * @property {string} projectId
 * @property {number} onTime      - 1 if delivered on/before due, else 0 (delivery score input)
 */
