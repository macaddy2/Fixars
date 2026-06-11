/**
 * ============================================================================
 *  Fixars Ecosystem Engine — Public entry point
 * ============================================================================
 *
 *  Import surface for the rest of the app (and for tests):
 *
 *    import { createEngine, createMemoryStore } from '@/engine'
 *    const store  = createMemoryStore(seed)
 *    const engine = createEngine({ store })
 *    engine.send('concept', 'cn1', 'SUBMIT')
 *
 *  Everything the engine needs (state machines, rules, effects) has sensible
 *  defaults, so `createEngine({ store })` is enough to get the full ecosystem
 *  behaviour described in docs/ecosystem-webbing.md. Each piece can be
 *  overridden for tests or for wiring a real backend's effects in place of the
 *  in-memory ones.
 * ============================================================================
 */

export { createEngine, consoleLogger, silentLogger } from './engine.js'
export { createMemoryStore, EFFECTS, POINTS } from './effects.js'
export { MACHINES } from './stateMachines.js'
export { RULES, indexRules } from './rules.js'
export { EVENTS, VALIDATION_THRESHOLD, CONVICTION_FEE } from './events.js'
export { KYC } from './guards.js'
