/**
 * ============================================================================
 *  Fixars Ecosystem Engine — Effects (the "THEN" actions) + reference Store
 * ============================================================================
 *
 *  Effects are the side-effects a rule performs when it fires: award points,
 *  create a project room, release an escrow tranche, refund investors, etc.
 *  They are the only place in the engine that *writes* anything.
 *
 *  Two halves in this file:
 *    1. createMemoryStore() — a tiny in-memory data layer so the engine runs
 *       end-to-end with no backend. A real deployment swaps this for Supabase /
 *       Postgres while keeping the same method surface (get/put/update/all + a
 *       few domain ledgers).
 *    2. EFFECTS — the registry mapping an action name to its implementation.
 *       Rules reference effects by name (`{ effect: 'awardPoints', args: {...} }`),
 *       which keeps the rules table declarative and swappable.
 *
 *  Idempotency
 *  -----------
 *  Events can be redelivered, so money-moving effects MUST be safe to run twice.
 *  Each such effect records what it has already done (e.g. a per-milestone
 *  "released" flag) and no-ops on repeat. The engine also de-dupes at the
 *  (event, rule) level, but defence-in-depth here protects against replays.
 *
 *  Effect contract
 *  ---------------
 *    (ctx) => void
 *    ctx = { event, args, store, engine, logger }
 *      event  — the event that triggered the rule (has .payload)
 *      args   — static parameters from the rule definition (e.g. points reason)
 *      store  — the data layer (read + write)
 *      engine — to cascade further commands (engine.send) if an effect must
 *      logger — structured logging
 * ============================================================================
 */

import { CONVICTION_FEE } from './events.js'

/**
 * Points awarded per reason (PRD §5.3 "earning"). Centralised so product can
 * tune the economy in one place. Cross-app multipliers (PRD: 1.5x) would layer
 * on top of these in the awardPoints effect.
 * @readonly
 */
export const POINTS = Object.freeze({
  CONCEPT_VALIDATED: 50,
  CAMPAIGN_FUNDED: 200,
  MILESTONE_VERIFIED: 75,
  ENGAGEMENT_COMPLETED: 60,
})

/**
 * @typedef {ReturnType<typeof createMemoryStore>} Store
 */

/**
 * Build an in-memory store. Entities live in typed tables; cross-cutting facts
 * (points, feed, notifications, escrow, conviction markets) live in ledgers so
 * they are easy to inspect and assert against in the demo/tests.
 */
export function createMemoryStore(seed = {}) {
  /** @type {Map<string, Map<string, any>>} type -> (id -> entity) */
  const tables = new Map()
  const table = (type) => {
    if (!tables.has(type)) tables.set(type, new Map())
    return tables.get(type)
  }

  // Pre-load any seed data: { user: [...], concept: [...], ... }
  for (const [type, rows] of Object.entries(seed)) {
    for (const row of rows) table(type).set(row.id, { ...row })
  }

  // Domain ledgers (append-only where it makes sense).
  const pointsLedger = []
  const feed = []
  const notifications = []
  /** campaignId -> { held:number, released:Set<milestoneId>, frozen:Set<milestoneId> } */
  const escrow = new Map()
  /** milestoneId -> { outcome:'YES'|'NO'|null, settled:boolean } */
  const conviction = new Map()

  return {
    // ---- generic entity access --------------------------------------------
    get: (type, id) => table(type).get(id) ?? null,
    all: (type) => [...table(type).values()],
    put: (type, entity) => {
      table(type).set(entity.id, { ...entity })
      return table(type).get(entity.id)
    },
    /** Shallow-merge a patch into an existing entity. */
    update: (type, id, patch) => {
      const cur = table(type).get(id)
      if (!cur) throw new Error(`update: ${type}/${id} not found`)
      const next = { ...cur, ...patch }
      table(type).set(id, next)
      return next
    },

    // ---- domain ledgers (exposed for effects + assertions) ----------------
    pointsLedger,
    feed,
    notifications,
    escrow,
    conviction,

    /** Convenience: a user's spendable wallet balance (naira). */
    walletOf: (userId) => table('user').get(userId)?.wallet ?? 0,
  }
}

/* ============================================================================
 *  EFFECTS registry
 * ========================================================================== */

export const EFFECTS = {
  /**
   * Mark a validated concept as fundable and pre-fill a vestDen campaign draft
   * from it (PRD CN-04 / vestDen ID-01 "one-click pre-fill"). Idempotent: if a
   * campaign already exists for this concept, do nothing.
   */
  enableCampaignCreation({ event, store, logger }) {
    const { conceptId, ownerId, title } = event.payload
    store.update('concept', conceptId, { fundable: true })

    const exists = store.all('campaign').some((c) => c.conceptId === conceptId)
    if (exists) return // replay-safe

    const campaignId = `camp_${conceptId}`
    store.put('campaign', {
      id: campaignId,
      conceptId,
      conceptState: 'validated', // denormalised so the LAUNCH guard stays pure
      founderId: ownerId,
      title,
      state: 'draft',
      target: 0,
      raised: 0,
      milestones: [],
      investorIds: [],
    })
    logger.info('campaign draft created', { campaignId, conceptId })
  },

  /**
   * Award Fixars Points to a user for an action. `args.reason` selects the base
   * amount from POINTS. Appends to the ledger (auditable) and increments the
   * cached balance on the user.
   */
  awardPoints({ event, args, store, logger }) {
    const userId = args.userId ? event.payload[args.userId] : event.payload.ownerId || event.payload.founderId
    const amount = POINTS[args.reason] ?? 0
    if (!userId || !amount) return
    store.pointsLedger.push({ userId, reason: args.reason, amount, at: event.at, eventId: event.id })
    const user = store.get('user', userId)
    if (user) store.update('user', userId, { points: (user.points ?? 0) + amount })
    logger.info('points awarded', { userId, reason: args.reason, amount })
  },

  /** Post a human-readable item to the universal feed (PRD §5.2). */
  postToFeed({ event, args, store }) {
    store.feed.unshift({
      id: `feed_${event.id}`,
      app: args.app,
      text: args.text(event.payload),
      at: event.at,
    })
  },

  /**
   * Fan a notification out to one or more recipients (PRD §5.2). Recipients may
   * be plain user ids or investor records ({ userId, amount }); we normalise to
   * the id either way so the same effect serves both audiences.
   */
  notify({ event, args, store }) {
    const raw = args.toField ? [].concat(event.payload[args.toField] ?? []) : [].concat(args.to ?? [])
    for (const r of raw) {
      const userId = r?.userId ?? r
      store.notifications.unshift({
        id: `ntf_${event.id}_${userId}`,
        userId,
        text: args.text(event.payload),
        read: false,
        at: event.at,
      })
    }
  },

  /**
   * Create the CollaBoard project room for a funded campaign (vestDen → CollaBoard).
   * Idempotent via the campaign's projectId.
   */
  createProjectRoom({ event, store, logger }) {
    const { campaignId, founderId, conceptId } = event.payload
    const campaign = store.get('campaign', campaignId)
    if (campaign?.projectId) return // already created

    const projectId = `proj_${campaignId}`
    store.put('project', {
      id: projectId,
      campaignId,
      conceptId,
      ownerId: founderId,
      state: 'active',
      members: [founderId],
    })
    store.update('campaign', campaignId, { projectId })
    logger.info('project room created', { projectId, campaignId })
  },

  /**
   * Open an escrow account for the campaign and load the raised funds into it,
   * to be released milestone by milestone (PRD §9.3 escrow; vestDen §4.1).
   * Idempotent: an existing escrow account is left untouched.
   */
  buildEscrowSchedule({ event, store, logger }) {
    const { campaignId, raised } = event.payload
    if (store.escrow.has(campaignId)) return
    store.escrow.set(campaignId, { held: raised, released: new Set(), frozen: new Set() })
    logger.info('escrow funded', { campaignId, held: raised })
  },

  /**
   * Release one milestone's tranche from escrow to the founder's wallet.
   * MONEY-MOVING → strictly idempotent: a milestone already in `released` is a
   * no-op, and a frozen milestone is refused.
   */
  releaseEscrowTranche({ event, store, logger }) {
    const { campaignId, milestoneId, tranche } = event.payload
    const acct = store.escrow.get(campaignId)
    if (!acct) throw new Error(`escrow account missing for ${campaignId}`)
    if (acct.released.has(milestoneId)) return // replay-safe
    if (acct.frozen.has(milestoneId)) {
      logger.warn('release refused: milestone frozen', { campaignId, milestoneId })
      return
    }
    if (tranche > acct.held) throw new Error('tranche exceeds escrow balance')

    acct.held -= tranche
    acct.released.add(milestoneId)
    const project = store.get('project', event.payload.projectId)
    const founderId = store.get('campaign', campaignId)?.founderId || project?.ownerId
    const founder = store.get('user', founderId)
    if (founder) store.update('user', founderId, { wallet: (founder.wallet ?? 0) + tranche })
    logger.info('escrow tranche released', { campaignId, milestoneId, tranche, remaining: acct.held })
  },

  /** Freeze a milestone's funds pending dispute resolution (vestDen §4.1). */
  freezeEscrow({ event, store, logger }) {
    const { campaignId, milestoneId } = event.payload
    const acct = store.escrow.get(campaignId)
    if (acct) acct.frozen.add(milestoneId)
    logger.warn('escrow frozen', { campaignId, milestoneId })
  },

  /**
   * Credit verified contributors with proof points + a delivery-score input on
   * SkillsCanvas (CollaBoard → SkillsCanvas). Reputation reflects real delivery.
   */
  addProofPoints({ event, store }) {
    for (const talentId of event.payload.contributorIds ?? []) {
      const t = store.get('user', talentId)
      if (t) store.update('user', talentId, { proofPoints: (t.proofPoints ?? 0) + 1 })
    }
  },

  /**
   * Move a user's unified reputation score (PRD §9.1, 0–1000) by a delta,
   * clamped to range. `args.delta` and `args.userIdField` come from the rule.
   */
  updateReputation({ event, args, store }) {
    const userId = event.payload[args.userIdField]
    const u = store.get('user', userId)
    if (!u) return
    const next = Math.max(0, Math.min(1000, (u.reputation ?? 0) + args.delta))
    store.update('user', userId, { reputation: next })
  },

  /**
   * Settle the milestone's conviction market (vestDen §4.2). Winners split the
   * losing pool minus the 2% platform fee. Idempotent via `settled`.
   * `args.outcome` is 'YES' (milestone verified) or 'NO' (missed).
   */
  resolveConvictionMarket({ event, args, store, logger }) {
    const { milestoneId } = event.payload
    const market = store.conviction.get(milestoneId)
    if (!market || market.settled) return
    market.outcome = args.outcome
    market.settled = true
    const winningPool = market[args.outcome] ?? 0
    const losingPool = market[args.outcome === 'YES' ? 'NO' : 'YES'] ?? 0
    market.payout = winningPool + losingPool * (1 - CONVICTION_FEE)
    logger.info('conviction market settled', { milestoneId, outcome: args.outcome, payout: market.payout })
  },

  /**
   * Compensation / saga step: a campaign closed below target, so return every
   * backer's stake from escrow to their wallet (PRD: refund if below threshold;
   * vestDen ID-10). Idempotent via a per-campaign `refunded` flag.
   */
  refundInvestors({ event, store, logger }) {
    const { campaignId, investorIds } = event.payload
    const campaign = store.get('campaign', campaignId)
    if (campaign?.refunded) return
    for (const inv of investorIds ?? []) {
      const u = store.get('user', inv.userId ?? inv)
      const amount = inv.amount ?? 0
      if (u) store.update('user', u.id, { wallet: (u.wallet ?? 0) + amount })
    }
    store.update('campaign', campaignId, { refunded: true })
    logger.info('investors refunded', { campaignId, count: (investorIds ?? []).length })
  },

  /** Raise a risk flag on a project (PRD CB-13). */
  flagRisk({ event, store, logger }) {
    const { projectId } = event.payload
    const p = store.get('project', projectId)
    if (p) store.update('project', projectId, { riskFlag: true })
    logger.warn('project risk flagged', { projectId })
  },
}
