# Fixars Ecosystem Engine (pre‑AI)

The deterministic orchestration layer that connects the four sub‑apps. It is the
**runnable form of the three diagrams** in [`docs/ecosystem-webbing.md`](../../docs/ecosystem-webbing.md):

| Diagram view | Lives in code as |
|---|---|
| View 1 — Innovation Journey | the emergent behaviour you get when you run the engine |
| View 2 — Event Webbing | [`rules.js`](./rules.js) (the `WHEN → IF → THEN` table) + [`events.js`](./events.js) |
| View 3 — State Machines | [`stateMachines.js`](./stateMachines.js) |

## Why an engine (not GraphQL, not a diagram tool)
- **State machines** decide *what may happen next* to one entity (guards).
- **Events** are immutable facts emitted when a guarded transition commits.
- **Rules** subscribe to events and run **effects** — this is the cross‑app wiring.

GraphQL is a read API and is orthogonal; it can sit *on top* later. The engine is
the thing that "triggers at the initiation of a step."

## Files
```
events.js         Event names + payload schemas + tunables (threshold, fee)
guards.js         Pure boolean predicates (KYC, score, verified, …)
stateMachines.js  Concept / Campaign / Milestone / Engagement lifecycles
effects.js        The "THEN" actions + an in‑memory reference Store
rules.js          THE ALGORITHM: WHEN event → IF guard → THEN effects
engine.js         The dispatcher: send() + dispatch() + idempotency + sagas
index.js          Public entry point
demo.mjs          Runnable end‑to‑end proof (node src/engine/demo.mjs)
```

## Run it
```bash
node src/engine/demo.mjs      # drives the full journey, asserts effects, exits non‑zero on failure
```

## Use it
```js
import { createEngine, createMemoryStore, KYC } from '@/engine'

const store  = createMemoryStore({ user: [...], concept: [...] })
const engine = createEngine({ store })

engine.send('concept', 'cn1', 'PASS', { score: 84 })
// → emits concept.validated → rule auto‑creates a vestDen campaign, awards
//   points, posts to the feed, notifies the owner — all in one call.
```

## Guarantees the engine enforces
- **Legal transitions only** — an action illegal from the current state is refused, not applied.
- **Idempotency** — each `(event, rule)` runs at most once; money‑moving effects (escrow, refunds) also self‑guard against replays.
- **Compensation / sagas** — if a rule's effects throw midway, its `compensate` steps run; partial state is never left behind.
- **Bounded cascades** — `send → effect → send` chains are depth‑limited so a misconfigured rule cannot loop forever.
- **Auditability** — every emitted event is appended to `engine.log`.

## Wiring to the app / a real backend
The engine is backend‑agnostic: it depends only on a `store` (CRUD + a few
ledgers) and an `effects` map. To go live:
1. Replace `createMemoryStore` with a Supabase/Postgres‑backed store of the same shape.
2. Replace the in‑memory effects (or some of them) with real integrations
   (Paystack/escrow partner/notifications) — **same effect names, same contract**.
3. Drive `engine.send(...)` from the API/route handlers (or DB triggers) instead of the demo.

## Where AI plugs in later (no reshape needed)
AI is added as either:
- a **guard input** — e.g. a Gemini risk score that a `campaignFundable` guard reads, or
- an **effect** — e.g. `aiDueDiligence` / `aiTaskBreakdown` writing data a later guard/rule consumes.

The event names, state machines and rule structure stay exactly as they are — which
is the entire reason we modelled the webbing first.
