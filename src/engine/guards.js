/**
 * ============================================================================
 *  Fixars Ecosystem Engine — Guards (deterministic, pre-AI)
 * ============================================================================
 *
 *  A *guard* is a pure boolean predicate that decides whether something is
 *  allowed to happen. Guards are used in two places:
 *
 *    1. State-machine transitions — "may this entity move draft → submitted?"
 *       Signature: (entity, input) => boolean
 *
 *    2. Rules — "should this event actually fire its effects?"
 *       Signature: (event, store) => boolean
 *
 *  Why pure functions?
 *  -------------------
 *  - Determinism: the same inputs always give the same answer, so the engine
 *    is replayable and testable. (Replaying the event log must reproduce state.)
 *  - AI-readiness: when AI arrives, an AI signal (e.g. a Gemini risk score) is
 *    just *another input* to a guard here — the engine's shape never changes.
 *    Pre-AI, every guard below is plain arithmetic / comparisons.
 *
 *  Guards NEVER mutate state and NEVER perform side effects. They only read.
 * ============================================================================
 */

import { VALIDATION_THRESHOLD } from './events.js'

/** KYC tiers, ordered. Higher index = more verification (PRD §5.1). */
export const KYC = Object.freeze({ NONE: 0, T1_PHONE: 1, T2_NIN_BVN: 2, T3_FULL: 3 })

/* -------------------------- Transition guards ----------------------------- */
/* Used by state machines; receive the entity and the action input.           */

/**
 * The actor has at least Tier-1 (phone) verification.
 * Gates the very first meaningful action (PRD: phone is the entry KYC tier).
 * @param {{ownerKyc?: number}} entity
 * @returns {boolean}
 */
export const hasKycTier1 = (entity) => (entity.ownerKyc ?? KYC.NONE) >= KYC.T1_PHONE

/**
 * A concept's aggregate validation score clears the fundable threshold.
 * This is the ConceptNexus → vestDen connection expressed as a guard.
 * @param {{score?: number}} entity
 */
export const scorePassesThreshold = (entity) => (entity.score ?? 0) >= VALIDATION_THRESHOLD

/**
 * A campaign may only launch if its source concept is in the `validated` state.
 * The campaign carries a denormalised `conceptState` snapshot so this guard
 * stays pure (no store lookup needed at transition time).
 * @param {{conceptState?: string}} entity
 */
export const conceptIsValidated = (entity) => entity.conceptState === 'validated'

/**
 * A talent must be verified before being added to a project (SkillsCanvas PRD:
 * verified profile is the prerequisite gate for collaboration).
 * @param {{verified?: boolean}} entity
 */
export const talentIsVerified = (entity) => entity.verified === true

/* ----------------------------- Rule guards -------------------------------- */
/* Used by the rules table; receive the event and a read-only store.          */

/**
 * Re-check the fundable conditions at *dispatch* time, defensively. Even though
 * the state machine already guarded the transition, rules run asynchronously
 * and the world may have changed — so a guard here keeps effects honest.
 * @param {{payload: {score?: number, ownerId: string}}} event
 * @param {import('./effects.js').Store} store
 */
export const conceptFundable = (event, store) => {
  const owner = store.get('user', event.payload.ownerId)
  const scoreOk = (event.payload.score ?? 0) >= VALIDATION_THRESHOLD
  const kycOk = (owner?.kycTier ?? KYC.NONE) >= KYC.T1_PHONE
  return scoreOk && kycOk
}

/**
 * Confirm the campaign genuinely hit its target before we spin up a project
 * room and an escrow schedule (the expensive, hard-to-undo side of the flow).
 * @param {{payload: {raised: number, target: number}}} event
 */
export const campaignReachedTarget = (event) =>
  (event.payload.raised ?? 0) >= (event.payload.target ?? Infinity)

/**
 * Always-true guard. Used by rules that should fire unconditionally; naming it
 * makes the rules table self-documenting (`guard: always`) rather than leaving
 * the field blank and ambiguous.
 */
export const always = () => true
