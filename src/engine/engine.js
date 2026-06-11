/**
 * ============================================================================
 *  Fixars Ecosystem Engine — Core (the dispatcher)
 * ============================================================================
 *
 *  The engine does exactly two things:
 *
 *    send(type, id, action, input)
 *      Drive a single entity through its state machine. Validates the action
 *      against the current state, checks the transition guard, commits the new
 *      state, and — if the transition declares one — publishes an event.
 *
 *    (internal) dispatch(event)
 *      Find every rule subscribed to the event, run each rule's guard, and
 *      execute its effects with idempotency + compensation. Effects may call
 *      engine.send(...) again, which is how one fact cascades across apps
 *      (concept.validated → campaign created → … ). Cascades are depth-bounded
 *      so a misconfigured rule can never loop forever.
 *
 *  The engine holds no domain knowledge of its own: machines, rules and effects
 *  are all injected. That keeps it tiny and makes the *configuration* (the three
 *  diagrams) the thing you reason about — not the plumbing.
 * ============================================================================
 */

import { MACHINES } from './stateMachines.js'
import { RULES, indexRules } from './rules.js'
import { EFFECTS } from './effects.js'

/** Minimal structured logger. Pass `{ logger: silentLogger }` to mute. */
export const consoleLogger = {
  info: (msg, ctx) => console.log(`  · ${msg}`, ctx ? JSON.stringify(ctx) : ''),
  warn: (msg, ctx) => console.warn(`  ! ${msg}`, ctx ? JSON.stringify(ctx) : ''),
  error: (msg, ctx) => console.error(`  ✗ ${msg}`, ctx ? JSON.stringify(ctx) : ''),
}
export const silentLogger = { info() {}, warn() {}, error() {} }

/**
 * Create an engine instance.
 *
 * @param {object} cfg
 * @param {import('./effects.js').Store} cfg.store - the data layer (required)
 * @param {object} [cfg.machines] - entityType → state machine (defaults to MACHINES)
 * @param {Array}  [cfg.rules]    - rules table (defaults to RULES)
 * @param {object} [cfg.effects]  - effect name → implementation (defaults to EFFECTS)
 * @param {object} [cfg.logger]   - structured logger (defaults to consoleLogger)
 * @param {number} [cfg.maxCascade=8] - max nesting depth for send→effect→send chains
 */
export function createEngine({
  store,
  machines = MACHINES,
  rules = RULES,
  effects = EFFECTS,
  logger = consoleLogger,
  maxCascade = 8,
} = {}) {
  if (!store) throw new Error('createEngine: a store is required')

  const rulesByEvent = indexRules(rules)

  // Append-only log of everything that has happened (audit + replay source).
  const eventLog = []
  // Idempotency ledger: a Set of "<eventId>::<ruleId>" that have run to completion.
  // An event redelivered later will skip rules it already completed.
  const processed = new Set()

  let seq = 0 // monotonic, gives each event a stable, ordered id
  let depth = 0 // current send→effect→send nesting (for the cascade bound)

  /**
   * Publish an event and run its subscribed rules. Internal — events are only
   * created by `send` when a transition declares `emit`.
   * @param {object} event
   */
  function dispatch(event) {
    eventLog.push(event)
    logger.info(`event ${event.name}`, { entity: `${event.type}/${event.entityId}` })

    for (const rule of rulesByEvent.get(event.name) ?? []) {
      const key = `${event.id}::${rule.id}`
      if (processed.has(key)) continue // already handled this (event, rule) pair

      // IF — guard decides whether the rule applies right now. A false guard is
      // not a failure; we simply skip (and DON'T mark processed, so a future
      // redelivery under changed conditions could still fire).
      const guard = rule.guard ?? (() => true)
      if (!guard(event, store)) continue

      // THEN — run effects in order, tracking what succeeded for compensation.
      const applied = []
      try {
        for (const step of rule.then) {
          const effect = effects[step.effect]
          if (!effect) throw new Error(`unknown effect "${step.effect}" in rule ${rule.id}`)
          effect({ event, args: step.args ?? {}, store, engine: api, logger })
          applied.push(step)
        }
        processed.add(key) // success → never run this pair again
      } catch (err) {
        // A rule must not leave the world half-changed. Run its compensation
        // (author-defined undo) best-effort, then record the failure and move on.
        logger.error(`rule ${rule.id} failed after ${applied.length} step(s): ${err.message}`)
        runCompensation(rule, event)
      }
    }
  }

  /** Best-effort reversal of a failed rule using its declared `compensate` steps. */
  function runCompensation(rule, event) {
    for (const step of rule.compensate ?? []) {
      try {
        effects[step.effect]?.({ event, args: step.args ?? {}, store, engine: api, logger })
      } catch (e) {
        logger.error(`compensation step ${step.effect} failed: ${e.message}`)
      }
    }
  }

  /**
   * Drive one entity through one transition.
   *
   * @param {string} type   - entity type (must have a machine)
   * @param {string} id     - entity id (must exist in the store)
   * @param {string} action - the command (e.g. 'PASS', 'LAUNCH')
   * @param {object} [input] - extra fields to merge onto the entity before transitioning
   * @returns {{ok:boolean, state?:string, reason?:string, emitted?:string|null}}
   */
  function send(type, id, action, input = {}) {
    if (depth >= maxCascade) {
      throw new Error(`cascade depth ${depth} exceeded maxCascade=${maxCascade} (rule loop?)`)
    }

    const machine = machines[type]
    if (!machine) throw new Error(`send: no state machine for type "${type}"`)

    const entity = store.get(type, id)
    if (!entity) throw new Error(`send: ${type}/${id} not found`)

    // Entities track their current state in `.state` (defaulting to the
    // machine's initial state the first time we touch them).
    const current = entity.state ?? machine.initial
    const stateDef = machine.states[current]
    const transition = stateDef?.on?.[action]

    // Not a legal action from here — reject loudly but without throwing, so
    // callers (and tests) can assert on invalid transitions.
    if (!transition) {
      logger.warn(`illegal action "${action}" from ${type}/${id}@${current}`)
      return { ok: false, reason: 'illegal-transition', state: current }
    }

    // Merge any caller-supplied fields first (e.g. the validation `score`), so
    // the guard and payload builder see the up-to-date entity.
    const staged = { ...entity, ...input }
    if (transition.guard && !transition.guard(staged, input)) {
      return { ok: false, reason: 'guard-failed', state: current }
    }

    // Commit the new state.
    const updated = store.update(type, id, { ...input, state: transition.to })

    // Publish the event (if any) AFTER the state change is durable.
    let emitted = null
    if (transition.emit) {
      const event = {
        id: `evt_${++seq}`,
        name: transition.emit,
        type,
        entityId: id,
        payload: transition.payload ? transition.payload(updated, input) : {},
        at: Date.now(),
      }
      emitted = event.name
      depth += 1
      try {
        dispatch(event)
      } finally {
        depth -= 1
      }
    }

    return { ok: true, state: transition.to, emitted }
  }

  // Public surface. `api` is referenced inside dispatch/effects so effects can
  // cascade via engine.send.
  const api = {
    send,
    /** Read-only access to the audit log (every event, in order). */
    get log() {
      return [...eventLog]
    },
    /** Inspect idempotency state (handy in tests). */
    get processedKeys() {
      return [...processed]
    },
    store,
  }
  return api
}
