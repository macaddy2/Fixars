# Fixars Context Layer (FCL) — Technical Specification v0

**Status:** Draft v0 · 2026-07-02 · canonises the existing deterministic engine (`src/engine/`) as the first implementation of the FCL.
**Companion docs:** [`ecosystem-webbing.md`](./ecosystem-webbing.md) (the visual model), [`strategy-sovereignty.md`](./strategy-sovereignty.md) (why this layer is the asset), [`../src/engine/README.md`](../src/engine/README.md) (the running code).

The FCL is the **ontology/application layer** of Fixars: the machine-readable map of every
entity, rule and permitted action in the ecosystem, plus the ledger of every decision taken.
Models (AI or human) plug into it; they never replace it. While models commoditise, this
layer compounds — every event, decision and rule captured here makes the business it
describes more valuable, whichever model runs on top.

---

## §0 Design principles

1. **Model-agnostic by design.** The Action Catalog, guards and policies MUST NOT assume a
   specific model vendor. Any intelligence — Gemini today, another provider tomorrow, a
   heuristic, or a human — enters the FCL only as a *guard input* or an *effect*
   (see §3), behind the provider seam in [`src/lib/modelProvider.js`](../src/lib/modelProvider.js).
   Swapping the model must never cost the business anything it has captured.
2. **Sovereignty at SME scale.** The FCL's owner is the operator, not the platform and not
   a model vendor. At Fixars' scale, sovereignty means exactly three things:
   **data ownership, exportability, and explainability** — accruing as a byproduct of
   using Fixars day to day. It explicitly does **not** mean private compute, on-prem
   deployment, or consulting-grade ontology engagements. Do not build those.
3. **Deterministic core, intelligent edges.** Every state change flows through guarded
   transitions and declared rules. AI may inform a guard or run as an effect; it may never
   mutate state directly.
4. **Everything on the record.** Every emitted event is appended to an append-only log.
   If it isn't in the log, it didn't happen; if it is, it can be explained.
5. **Human approval gates for consequential actions.** Money-moving and reputation-moving
   actions must be gate-able by a human decision (§2).

## §1 Component map — the market's language → Fixars' code

| Ontology-layer concept | FCL component | Lives in code as |
|---|---|---|
| Facts / event stream | **Event Catalog** | [`src/engine/events.js`](../src/engine/events.js) — `EVENTS`, payload schemas, tunables |
| Ontology / world model | **World Model** | [`src/engine/stateMachines.js`](../src/engine/stateMachines.js) — entity lifecycles (`MACHINES`) + the typed entity store in [`effects.js`](../src/engine/effects.js) |
| Governance / policy-as-data | **Policy & Permissions** | [`src/engine/guards.js`](../src/engine/guards.js) — KYC tiers (`NONE/T1_PHONE/T2_NIN_BVN/T3_FULL`), score and verification predicates; rule guards in [`rules.js`](../src/engine/rules.js) |
| Safe, governed action | **Action API** | [`src/engine/effects.js`](../src/engine/effects.js) — the `EFFECTS` registry: the only way state changes (escrow, points, reputation, notifications) |
| Action catalog for agents | **Action Catalog** | [`src/engine/rules.js`](../src/engine/rules.js) — the `WHEN → IF → THEN` table; the seed catalog a future FixLab agent runtime plans over |
| Auditability / reasoning ledger | **Decision Log** | `engine.log` in [`src/engine/engine.js`](../src/engine/engine.js) — append-only event log with idempotency keys; surfaced to users as **Receipts** (`/receipts`) |

The engine's guarantees (legal transitions only, idempotency, saga compensation, bounded
cascades, auditability) are FCL invariants and carry over unchanged.

## §2 Human approval gates (spec only — no engine change yet)

Guards today return boolean. A future revision extends the guard result to
`true | false | PENDING_APPROVAL`: a transition whose guard returns `PENDING_APPROVAL`
is parked, a notification is raised to the accountable human, and the transition commits
only on their explicit approve action (which is itself an event in the Decision Log).
Escrow release (`releaseEscrowTranche`) and reputation writes (`updateReputation`) are the
first candidates. This is a declared design seam; nothing in `src/engine` changes now.

## §3 Where AI plugs in

Exactly two sockets, both already documented in the engine README:

- **Guard input** — a model produces a signal (risk score, quality score) that a
  deterministic guard *reads*. The guard, not the model, decides.
- **Effect** — a model runs as a declared effect (`aiDueDiligence`, `aiTaskBreakdown`)
  whose output is written as data for later guards/rules to consume.

Both sockets consume the provider interface in `src/lib/modelProvider.js` — never a vendor
SDK directly. Event names, machines and rule structure stay fixed across model swaps.

## §4 Policy categories

Policies are data, not code. The declared categories:

| Category | Examples in the current model |
|---|---|
| **Identity & KYC** | tiered gates (`T1_PHONE` to stake, `T2_NIN_BVN` to raise, `T3_FULL` for payouts) |
| **Eligibility** | `scorePassesThreshold` (validation ≥ 70), `talentIsVerified`, `conceptIsValidated` |
| **Financial** | escrow schedule construction, tranche release conditions, conviction-market fee (2%) |
| **Data-exhaust ownership** | see below — a policy default, not a feature |

**Data-exhaust ownership (policy default).** An operator's operational data — their
entities, transactions, points history, decision log and world model — **belongs to the
operator**:

- **Exportable** — a complete snapshot is downloadable at any time
  (Settings → Data & Sovereignty → *Export my data*; `exportSnapshot()` in
  [`src/lib/ledger.js`](../src/lib/ledger.js)).
- **Deletable** — locally held operational data can be erased by the owner
  (`deleteLocalData()`), consistent with NDPR expectations.
- **Never used to train competitors** — Fixars does not feed an operator's data exhaust
  into any model that could commoditise or compete with that operator. This is a
  contractual fact, not a slogan; it must survive every future model integration.

## §5 Open items (explicitly out of scope for v0)

- **Reputation → FCS mapping.** The engine's internal reputation is 0–1000
  (`updateReputation`); the user-facing **FCS (Fixars Credit Score) is canonical at
  300–850** (v2 design system, `ProfilePage`). Proposed mapping when wired:
  `fcs = 300 + round(reputation × 0.55)`. Until then the UI derives an estimate from
  points (`300 + round(points × 0.35)`, clamped).
- **Engine → UI wiring.** The engine has zero call sites in the app by design (the UI runs
  on the mock context layer). The Receipts surface consumes a normalized ledger shape
  (`{ id, type, actor, source, amount, points, label, reason, ts }`) that is a superset of
  the engine event shape, so `engine.log` can back it later via a `fromEngineEvent()`
  adapter without UI changes.
- **History persistence.** Points history (cap 50) and activities (cap 10) are in-memory
  in the demo build; the Decision Log thins across refreshes until a real store lands.
- **Human approval gates** (§2) — spec'd, not implemented.
