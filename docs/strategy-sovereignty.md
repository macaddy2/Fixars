# Fixars — Operational Sovereignty (Positioning Note)

**Status:** Adopted 2026-07-02 · derived from the strategy note *"The Splitting AI Stack &
Operational Sovereignty"* (v1.0, July 2026) · companion to [`fcl-spec.md`](./fcl-spec.md).

---

## 1. The market signal

Enterprise-AI value is migrating down a splitting stack:

1. **Strategic compute** at the bottom — capital-intensive, concentrated.
2. **Models** in the middle — commoditising, increasingly distrusted, rent-by-the-token.
3. **The ontology/application layer** on top — where durable value holds: the machine-readable
   map of how a business runs, plus the governed seam through which any intelligence may act.

**The analogy — the consultant and the manual.** A model is a brilliant freelance
consultant: smart, rentable by anyone, and not to be trusted with your secrets. The moat is
not the consultant; it is your own operating manual — the rulebook that tells any consultant
exactly how your business runs and what they may touch. The consultant is replaceable; the
manual is yours. **Whoever owns the manual owns the value.**

An independent market thesis is naming, almost component for component, the layer Fixars is
already building — the Fixars Context Layer ([FCL spec](./fcl-spec.md)) — and asserting that
this layer is where value will hold while models commoditise. The FCL is not a feature; it is
the load-bearing asset.

## 2. Sovereignty, re-scaled for the SME

The market frames sovereignty for governments and banks. For a Nigerian SME the fear is
different but the structure is identical.

**The analogy — the trader's notebook.** An informal operator's real edge lives in an
invisible notebook: supplier relationships, pricing instincts, who owes whom, which customer
pays late. Undocumented, it cannot be delegated, financed, scaled — or protected. Fixars'
pitch is not "let a black-box AI run your shop." It is: **"write your notebook down once, own
it forever, and point cheap rented intelligence at it under your rules."** That is
operational sovereignty for the small operator.

At SME scale, sovereignty means exactly three things — all already in the FCL design:

- **Data ownership** — the operator's data exhaust belongs to the operator, contractually.
- **Exportability** — the notebook is downloadable at any time (Settings → Data & Sovereignty).
- **Explainability** — every automated decision is on the record (the Decision Log,
  surfaced as **Receipts**).

And it accrues **as a byproduct of using Fixars day to day** — never as a consulting
engagement.

## 3. Adopted language

Use these phrases consistently across decks, briefs, product copy and the Stage 2
(automation-path) positioning:

- **"Operational sovereignty for African SMEs"** — you own your operating system; the model
  is just a rented worker.
- **"Models commoditise; your context compounds"** — every event, decision and rule captured
  in Fixars makes the business more valuable, whichever model runs on top.
- **"The manual, not the consultant"** — shorthand for why the FCL, not any AI vendor, is
  the moat.
- **"Model-agnostic by design"** — declared actions and policies mean Fixars can swap
  underlying models (Gemini today, others tomorrow) without the business losing anything.
- Partner/institution register: **"your data, your rules, your manual — Fixars is the
  notebook, not the landlord."**

## 4. Investor narrative — the market-timing frame

Capital is rotating toward the application/ontology layer globally; Fixars is the first
mover building that layer **for the African SME segment the global players will not reach**.
Thesis line for the deck: *the stack is splitting; models commoditise; Fixars owns the
compounding layer for African SMEs.*

The Palantir reference is permitted **only** as investor shorthand in rooms that know it,
and only with the re-scaling stated in the same breath: *"the same layer, radically
re-scaled for SMEs."*

## 5. Anti-drift guardrails (binding)

The transferable idea is the **layer** and the **ownership principle**. The transferable
customer is **not** the market thesis' customer. Therefore:

1. **Never** self-describe as "Palantir for Africa" in planning documents.
2. **Do not** build up-market sovereignty features — private compute, on-prem, six-figure
   ontology deployments. An SME will not pay for them and does not need them.
3. The context layer must be **radically cheaper and lighter**: it accrues from daily use of
   Fixars, not from a consulting engagement.
4. Sovereignty at this scale = data ownership + exportability + explainability. Nothing more.

## 6. Where this shows up in the product & docs

| Surface | Adoption |
|---|---|
| [`fcl-spec.md`](./fcl-spec.md) | Model-agnosticism (§0) and data-exhaust ownership (§4) as declared principles |
| `/receipts` (Receipts page) | The Decision Log as a user-facing trust product |
| Settings → Data & Sovereignty | Pledge copy + export ("your notebook") + delete |
| Splash (`Home`) | "Operational sovereignty for African SMEs" section + trust-strip line |
| `PRD.md` | Strategic Thesis paragraph |
| [`ecosystem-webbing.md`](./ecosystem-webbing.md) | Spine annotated as the ontology/application layer |

## 7. Known copy debt (flagged, not fixed here)

- `DataContext` mock data still carries `$` amounts and non-Nigerian seed names; these
  surface inside Receipts and contradict the ₦-first, Nigeria-first framing. Replace the
  seed data before any public demo (also flagged in the
  [launch-readiness review](./launch-readiness-review.md)).
- Points history and activity feeds are in-memory and capped; the Decision Log thins across
  refreshes until real persistence lands (FCL spec §5).
