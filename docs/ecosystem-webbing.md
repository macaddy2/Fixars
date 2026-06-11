# Fixars Ecosystem — Visual Webbing (pre‑AI)

Three views of one model. The **journey** shows the happy path; the **event webbing**
shows what fires what; the **state machines** show the guarded steps inside each app.
Guards in `[brackets]` are the deterministic conditions (pre‑AI).

---

## View 1 — The Innovation Journey (how the dots connect)

```mermaid
flowchart LR
  U(["👤 One identity · one wallet · one reputation (FCS)"])

  subgraph CN["🟣 ConceptNexus — IDEATE"]
    C1[Concept submitted]
    C2[Validated · score ≥ 70]
  end
  subgraph VD["🟢 vestDen — FUND"]
    V1[Campaign live]
    V2[Funded · 100%]
  end
  subgraph SC["🔵 SkillsCanvas — ASSEMBLE"]
    S1[Verified talent pool]
  end
  subgraph CB["🟠 CollaBoard — EXECUTE"]
    B1[Project room + escrow schedule]
    B2[Milestone verified]
    B3[Project completed]
  end

  C2 -->|concept.validated → enable campaign creation| V1
  V2 -->|campaign.funded → create room + escrow schedule| B1
  S1 -->|hired via contract| B1
  B2 -->|milestone.verified → release escrow tranche| V2
  B2 -->|proof points + delivery score| S1
  B3 -->|reputation ↑ for founder + contributors| U
  U -.->|points, KYC tier, reputation gate every step| CN
```

---

## View 2 — Event Webbing (publisher → event → subscribers)

This is the literal "webbing": every line is a subscription. The engine is just this table made runnable.

```mermaid
flowchart TB
  classDef app fill:#EEF1FD,stroke:#2F45E0,color:#0A1628;
  classDef evt fill:#FFF,stroke:#8695AE,color:#0A1628,stroke-dasharray:3 3;

  CN["🟣 ConceptNexus"]:::app
  VD["🟢 vestDen"]:::app
  CB["🟠 CollaBoard"]:::app
  SC["🔵 SkillsCanvas"]:::app
  CORE["⚙️ Core: Points · Reputation · Notifications · Feed · Escrow"]:::app

  e1(["concept.validated"]):::evt
  e2(["campaign.funded"]):::evt
  e3(["milestone.verified"]):::evt
  e4(["milestone.missed"]):::evt
  e5(["engagement.completed"]):::evt
  e6(["payment.completed"]):::evt

  CN --> e1 --> VD
  e1 --> CORE

  VD --> e2 --> CB
  e2 --> CORE

  CB --> e3
  e3 --> VD
  e3 --> SC
  e3 --> CORE

  CB --> e4
  e4 --> VD
  e4 --> CORE

  SC --> e5 --> CB
  e5 --> CORE

  CORE --> e6 --> VD
  e6 --> CORE
```

---

## View 3 — State Machines (the guarded steps inside each app)

The cross‑app triggers above are emitted **on the bold transitions** here.

### Concept (ConceptNexus)
```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> submitted: submit [owner.kyc ≥ T1]
  submitted --> in_review: validators assigned [≥1 eligible]
  in_review --> validated: aggregate score ≥ 70  «emit concept.validated»
  in_review --> rejected: score < 70
  validated --> funded: push to vestDen «one-click pre-fill»
  rejected --> draft: revise & resubmit
```

### Campaign (vestDen)
```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> live: launch [source.concept = validated]
  live --> funded: raised ≥ target  «emit campaign.funded»
  live --> failed: deadline passed & < target  «emit campaign.failed → refund»
  funded --> executing: CollaBoard room created
  executing --> completed: all milestones released
```

### Milestone (CollaBoard ↔ escrow)
```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> in_progress: work started
  in_progress --> submitted: deliverables attached
  submitted --> verified: AI + validator approve  «emit milestone.verified → escrow.release»
  submitted --> disputed: rejected / dispute raised  «escrow.freeze»
  verified --> [*]
  disputed --> in_progress: rework
  pending --> missed: due date passed, not submitted  «emit milestone.missed»
```

### Engagement (SkillsCanvas → CollaBoard)
```mermaid
stateDiagram-v2
  [*] --> offered
  offered --> accepted: talent accepts [talent.verified]
  offered --> declined: talent declines
  accepted --> active: added to project
  active --> delivered: task approved  «emit engagement.completed → proof points»
  delivered --> rated: hirer rates  «reputation ↑»
  rated --> [*]
```

---

## Reading the webbing as rules (preview of the algo layer)

Each subscription line above is one row of `WHEN event → IF guard → THEN actions`:

| WHEN (event) | IF (guard) | THEN (actions) |
|---|---|---|
| `concept.validated` | `score ≥ 70 ∧ owner.kyc ≥ T1` | enable campaign creation · award points · post to feed |
| `campaign.funded` | `raised ≥ target` | create CollaBoard room · build escrow schedule · notify investors |
| `milestone.verified` | `approvals ≥ quorum` | release escrow tranche · add SkillsCanvas proof points · resolve conviction market = YES |
| `milestone.missed` | `now > due ∧ status ≠ submitted` | resolve conviction market = NO · flag project risk |
| `engagement.completed` | `task.status = approved` | award points · update delivery score · update reputation |

Two invariants the algo must enforce on every row: **idempotency** (safe to run twice — events get redelivered) and **compensation** (a defined undo path, e.g. `campaign.failed → refund all investors`).
