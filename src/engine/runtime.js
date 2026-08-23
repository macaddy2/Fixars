/**
 * ============================================================================
 *  Fixars Engine Runtime — the bridge between the app and @/engine
 * ============================================================================
 *
 *  This module ACTIVATES the ecosystem engine (previously dead code) by:
 *    1. Owning a session-scoped engine instance (memory store + real effects).
 *    2. Overriding the cross-app effects so their side-effects land in the
 *       real backend where RLS allows, and into an ephemeral in-memory mirror
 *       everywhere else (escrow/rooms are mirrored until they get real tables).
 *
 *  Guarantees:
 *    - Every helper is fail-soft: engine problems must NEVER break app flows.
 *    - The DB remains the source of truth; helpers are only invoked AFTER the
 *      corresponding DB write has already succeeded.
 *    - Points are awarded server-side via award_points() RPC (self-scoped);
 *      awards for OTHER users are skipped client-side and left to a future
 *      service-role trigger.
 *    - Cross-user notifications are blocked by RLS by design, so notify()
 *      only delivers to the signed-in user; other recipients are logged.
 * ============================================================================
 */

import { createEngine, silentLogger } from './engine.js'
import { createMemoryStore, EFFECTS, POINTS } from './effects.js'
import { isSupabaseConfigured } from '@/lib/supabase'
import { createActivityDB } from '@/lib/db/activities'
import { createNotificationDB } from '@/lib/db/social'
import { awardPointsDB } from '@/lib/db/points'

// ── Who is signed in? Set by DataProvider so effects can self-scope. ──
let currentUserId = null
export function setRuntimeUser(userId) {
    currentUserId = userId
}

// Map engine POINTS reasons → server award_points action keys
const REASON_TO_ACTION = {
    CONCEPT_VALIDATED: 'IDEA_VALIDATED',
    CAMPAIGN_FUNDED: 'CAMPAIGN_FUNDED',
    MILESTONE_VERIFIED: 'MILESTONE_VERIFIED',
    ENGAGEMENT_COMPLETED: 'ENGAGEMENT_COMPLETED',
}

function fail(label) {
    return (err) => console.warn(`[engine] ${label} failed:`, err?.message || err)
}

/** Effects that touch the real backend (fire-and-forget — dispatch is sync). */
const AppEffects = {
    ...EFFECTS,

    awardPoints({ event, args, store, logger }) {
        const userId = args.userId ? event.payload[args.userId] : (event.payload.ownerId || event.payload.founderId)
        const amount = POINTS[args.reason] ?? 0
        if (!userId || !amount) return

        // In-memory mirror always updates (session-level consistency)
        store.pointsLedger.push({ userId, reason: args.reason, amount, at: event.at, eventId: event.id })
        const user = store.get('user', userId)
        if (user) store.update('user', userId, { points: (user.points ?? 0) + amount })

        // Real award only for the signed-in user — the RPC is self-scoped by
        // design so one browser can never mint points for someone else.
        if (isSupabaseConfigured() && userId === currentUserId) {
            const action = REASON_TO_ACTION[args.reason]
            if (!action) return
            awardPointsDB(action)
                .then(() => {
                    window.dispatchEvent(new CustomEvent('fixars:points-awarded', {
                        detail: { action, points: amount, label: args.reason }
                    }))
                })
                .catch(fail('awardPoints'))
            logger.info('points awarded (server)', { userId, reason: args.reason, amount })
        }
    },

    postToFeed({ event, args }) {
        let text = ''
        try { text = args.text(event.payload) } catch { /* payload shape drift */ }
        if (!text) return

        if (isSupabaseConfigured()) {
            createActivityDB({ type: 'engine', userName: 'Fixars', message: text, app: args.app })
                .catch(fail('postToFeed'))
        }
    },

    notify({ event, args, logger }) {
        let recipients = []
        try {
            recipients = args.toField
                ? [].concat(event.payload[args.toField] ?? [])
                : [].concat(args.to ?? [])
        } catch { return }

        const rawText = (() => { try { return args.text(event.payload) } catch { return '' } })()

        for (const r of recipients) {
            const userId = r?.userId ?? r
            // RLS restricts notification inserts to self (anti-spoofing), so
            // only the signed-in recipient is delivered from this client.
            // Fan-out to others belongs in a service-role trigger/function.
            if (!isSupabaseConfigured() || userId !== currentUserId) {
                logger.info?.('notify skipped (not self / mock mode)', { userId })
                continue
            }
            createNotificationDB({
                userId,
                type: 'ecosystem',
                title: 'Ecosystem update',
                message: rawText,
            }).catch(fail('notify'))
        }
    },
}

let runtime = null

function getRuntime() {
    if (!runtime) {
        const store = createMemoryStore()
        const engine = createEngine({ store, effects: AppEffects, logger: silentLogger })
        runtime = { engine, store }
    }
    return runtime
}

/** Ensure user/concept entities exist before sending commands. */
function ensureConcept({ id, ownerId, title, score = 0, kycTier = 1 }) {
    const { store } = getRuntime()
    if (!store.get('user', ownerId)) {
        store.put('user', { id: ownerId, name: ownerId, kycTier: 1 })
    }
    let concept = store.get('concept', id)
    if (!concept) {
        concept = store.put('concept', { id, ownerId, title, ownerKyc: kycTier, score })
    }
    return concept
}

/**
 * An idea was submitted (DB write already succeeded).
 */
export function conceptSubmitted(idea, { kycTier = 1 } = {}) {
    try {
        const concept = ensureConcept({
            id: idea.id,
            ownerId: idea.creatorId,
            title: idea.title,
            kycTier,
        })
        getRuntime().engine.send('concept', concept.id, 'SUBMIT')
    } catch (err) {
        fail('conceptSubmitted')(err)
    }
}

/**
 * Votes changed. When the DB's validation condition is met (score >= 75 with
 * at least 10 votes — mirrors update_idea_votes()), drive the concept through
 * ASSIGN_VALIDATORS → PASS, cascading campaign creation, points, feed, notify.
 */
export function conceptVotesUpdated(idea) {
    try {
        const total = (idea.votes?.up || 0) + (idea.votes?.down || 0)
        const validated = idea.validationScore >= 75 && total >= 10

        const concept = ensureConcept({
            id: idea.id,
            ownerId: idea.creatorId,
            title: idea.title,
            score: idea.validationScore,
        })
        void concept

        const engine = getRuntime().engine
        const state = getRuntime().store.get('concept', idea.id)?.state

        if (state === 'draft') engine.send('concept', idea.id, 'SUBMIT')
        if (validated && ['draft', 'submitted'].includes(state)) {
            engine.send('concept', idea.id, 'ASSIGN_VALIDATORS')
        }
        if (validated) {
            getRuntime().store.update('concept', idea.id, { score: idea.validationScore })
            engine.send('concept', idea.id, 'PASS', { score: idea.validationScore })
        }
    } catch (err) {
        fail('conceptVotesUpdated')(err)
    }
}

/**
 * A stake/campaign reached its target (DB trigger already flipped status to
 * 'funded'). Cascades room + escrow mirrors, founder points, investor notify.
 */
export function campaignFunded(stake) {
    try {
        const { engine, store } = getRuntime()

        if (!store.get('user', stake.creatorId)) {
            store.put('user', { id: stake.creatorId, name: stake.creatorName, kycTier: 1 })
        }
        if (!store.get('campaign', stake.id)) {
            store.put('campaign', {
                id: stake.id,
                conceptId: null,
                conceptState: 'validated',
                founderId: stake.creatorId,
                title: stake.title,
                state: 'live',
                target: Number(stake.targetAmount),
                raised: Number(stake.currentAmount),
                milestones: [],
                investorIds: (stake.stakers || []).map(s => ({ userId: s.userId, amount: Number(s.amount) })),
            })
        }

        const state = store.get('campaign', stake.id)?.state
        if (state === 'live') {
            engine.send('campaign', stake.id, 'MARK_FUNDED')
        }
    } catch (err) {
        fail('campaignFunded')(err)
    }
}

/** Test/inspection hook. */
export function _getEngineForTests() {
    return getRuntime().engine
}
