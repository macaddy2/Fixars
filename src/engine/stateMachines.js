/**
 * ============================================================================
 *  Fixars Ecosystem Engine — State Machines
 * ============================================================================
 *
 *  Declarative lifecycle for each core entity. This file is the data form of
 *  "View 3 — State Machines" (docs/ecosystem-webbing.md). Nothing here runs;
 *  the engine (engine.js) interprets these definitions.
 *
 *  Shape of a machine
 *  ------------------
 *    {
 *      initial: 'draft',
 *      states: {
 *        <stateName>: {
 *          final?: true,                 // no transitions leave a final state
 *          on: {
 *            <ACTION>: {
 *              to: '<nextState>',        // required: target state
 *              guard?: (entity, input) => boolean,  // optional precondition
 *              emit?: '<event.name>',    // optional fact to publish on success
 *              // builds the event payload from the post-transition entity:
 *              payload?: (entity, input) => object,
 *            }
 *          }
 *        }
 *      }
 *    }
 *
 *  An ACTION is a command ("PASS", "LAUNCH"). A transition is only taken when:
 *    (a) the entity is in a state that lists the ACTION, AND
 *    (b) the transition's `guard` (if any) returns true.
 *  If the transition declares `emit`, the engine publishes that event AFTER the
 *  state change commits — which is what wires the apps together.
 *
 *  The transitions that carry `emit` are exactly the green edges in View 3.
 * ============================================================================
 */

import { EVENTS } from './events.js'
import {
  hasKycTier1,
  scorePassesThreshold,
  conceptIsValidated,
  talentIsVerified,
} from './guards.js'

/* ------------------------------- Concept ---------------------------------- */
/* ConceptNexus: an idea is validated by peers before it can be funded.        */
export const conceptMachine = {
  initial: 'draft',
  states: {
    draft: {
      on: {
        // First gate in the whole ecosystem: you must be phone-verified to submit.
        SUBMIT: { to: 'submitted', guard: hasKycTier1 },
      },
    },
    submitted: {
      on: {
        ASSIGN_VALIDATORS: { to: 'in_review' },
      },
    },
    in_review: {
      on: {
        // Passing validation is the ConceptNexus → vestDen hand-off: it emits
        // `concept.validated`, which a rule turns into a fundable campaign.
        PASS: {
          to: 'validated',
          guard: scorePassesThreshold,
          emit: EVENTS.CONCEPT_VALIDATED,
          payload: (c) => ({ conceptId: c.id, ownerId: c.ownerId, score: c.score, title: c.title }),
        },
        FAIL: {
          to: 'rejected',
          emit: EVENTS.CONCEPT_REJECTED,
          payload: (c) => ({ conceptId: c.id, ownerId: c.ownerId, score: c.score }),
        },
      },
    },
    validated: {
      on: {
        // One-click push to vestDen (PRD CN-04). The campaign itself is created
        // by the `concept.validated` rule; this transition just records that the
        // owner chose to graduate the concept.
        PUSH_TO_VESTDEN: { to: 'funded' },
      },
    },
    rejected: {
      on: { REVISE: { to: 'draft' } }, // address feedback and try again
    },
    funded: { final: true },
  },
}

/* ------------------------------ Campaign ---------------------------------- */
/* vestDen: a validated concept raises milestone-based, escrowed funding.      */
export const campaignMachine = {
  initial: 'draft',
  states: {
    draft: {
      on: {
        // Cannot open a round unless the backing concept is validated.
        LAUNCH: {
          to: 'live',
          guard: conceptIsValidated,
          emit: EVENTS.CAMPAIGN_LAUNCHED,
          payload: (c) => ({ campaignId: c.id, founderId: c.founderId, conceptId: c.conceptId }),
        },
      },
    },
    live: {
      on: {
        // Reaching target is the vestDen → CollaBoard hand-off (creates the room).
        MARK_FUNDED: {
          to: 'funded',
          emit: EVENTS.CAMPAIGN_FUNDED,
          payload: (c) => ({
            campaignId: c.id,
            founderId: c.founderId,
            conceptId: c.conceptId,
            target: c.target,
            raised: c.raised,
            milestones: c.milestones,
            investorIds: c.investorIds,
          }),
        },
        // Closing below target triggers the refund saga via `campaign.failed`.
        CLOSE_UNFUNDED: {
          to: 'failed',
          emit: EVENTS.CAMPAIGN_FAILED,
          payload: (c) => ({ campaignId: c.id, investorIds: c.investorIds, raised: c.raised }),
        },
      },
    },
    funded: {
      on: { START_EXECUTION: { to: 'executing' } }, // room created → work begins
    },
    executing: {
      on: { COMPLETE: { to: 'completed' } }, // all milestone tranches released
    },
    failed: { final: true },
    completed: { final: true },
  },
}

/* ------------------------------ Milestone --------------------------------- */
/* CollaBoard ↔ escrow: the unit of accountable, fund-releasing progress.      */
export const milestoneMachine = {
  initial: 'pending',
  states: {
    pending: {
      on: {
        START: { to: 'in_progress' },
        // Time-based transition (the engine's clock driver calls this when a
        // due date passes without a submission). Emits the conviction "NO".
        MISS: {
          to: 'missed',
          emit: EVENTS.MILESTONE_MISSED,
          payload: (m) => ({ milestoneId: m.id, campaignId: m.campaignId, projectId: m.projectId }),
        },
      },
    },
    in_progress: {
      on: {
        SUBMIT: {
          to: 'submitted',
          emit: EVENTS.MILESTONE_SUBMITTED,
          payload: (m) => ({ milestoneId: m.id, campaignId: m.campaignId, projectId: m.projectId }),
        },
      },
    },
    submitted: {
      on: {
        // Approval is the CollaBoard → (vestDen escrow + SkillsCanvas) hand-off.
        VERIFY: {
          to: 'verified',
          emit: EVENTS.MILESTONE_VERIFIED,
          payload: (m) => ({
            milestoneId: m.id,
            campaignId: m.campaignId,
            projectId: m.projectId,
            founderId: m.founderId, // so the funding-release points route to the founder
            tranche: m.tranche,
            contributorIds: m.contributorIds,
          }),
        },
        REJECT: { to: 'disputed' }, // freezes escrow (handled by a rule)
      },
    },
    disputed: {
      on: { REWORK: { to: 'in_progress' } },
    },
    verified: { final: true },
    missed: { final: true },
  },
}

/* ----------------------------- Engagement --------------------------------- */
/* SkillsCanvas → CollaBoard: a talent's contract on a project.                */
export const engagementMachine = {
  initial: 'offered',
  states: {
    offered: {
      on: {
        ACCEPT: { to: 'accepted', guard: talentIsVerified },
        DECLINE: { to: 'declined' },
      },
    },
    accepted: {
      on: { ACTIVATE: { to: 'active' } }, // added to the project
    },
    active: {
      on: {
        // Delivery feeds proof points + delivery score back to SkillsCanvas.
        DELIVER: {
          to: 'delivered',
          emit: EVENTS.ENGAGEMENT_COMPLETED,
          payload: (e) => ({
            engagementId: e.id,
            talentId: e.talentId,
            projectId: e.projectId,
            onTime: e.onTime ?? 1,
          }),
        },
      },
    },
    delivered: {
      on: { RATE: { to: 'rated' } }, // hirer rating → reputation bump (rule)
    },
    declined: { final: true },
    rated: { final: true },
  },
}

/**
 * Registry the engine uses to resolve `entityType` → machine.
 * Keys here are the entity types passed to `engine.send(type, id, action)`.
 */
export const MACHINES = Object.freeze({
  concept: conceptMachine,
  campaign: campaignMachine,
  milestone: milestoneMachine,
  engagement: engagementMachine,
})
