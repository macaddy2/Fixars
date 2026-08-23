# Fixars Network and Event Architecture

Status: approved direction, pre-deployment implementation plan

This document combines the public-domain routing model with the internal event and webhook model. It does not assert that DNS, certificates, webhook endpoints, databases, queues, or production integrations are already live.

## 1. Architectural boundaries

- `FixarsGroup.com` is the corporate governance and portfolio site.
- `Fixars.ai` is the public ecosystem hub, discovery layer, and read-only cross-product activity surface.
- SkillsCanvas, ConceptsNexus, CollaBoard, and VestDen remain independently deployable products with separate canonical domains and data ownership.
- Fixars.ai may hold derived projections for discovery and activity feeds. It must not become the authoritative database for every product.
- The current Fixars.ai waitlist root remains isolated until a later, explicitly approved hub migration.

## 2. Public routing

| Product       | Canonical domain            | Fixars connector subdomain    | Fixars connector path        |
| ------------- | --------------------------- | ----------------------------- | ---------------------------- |
| SkillsCanvas  | `https://skillscanvas.co/`  | `https://skills.fixars.ai/`   | `https://fixars.ai/skills`   |
| ConceptsNexus | `https://conceptsnexus.co/` | `https://concepts.fixars.ai/` | `https://fixars.ai/concepts` |
| CollaBoard    | `https://collaboard.co/`    | `https://collab.fixars.ai/`   | `https://fixars.ai/collab`   |
| VestDen       | `https://vestden.co/`       | `https://vest.fixars.ai/`     | `https://fixars.ai/vest`     |

The standalone product domain is canonical. Connector subdomains and paths issue server-side permanent redirects and preserve the remainder of the path. For example, `https://fixars.ai/skills/passport` redirects to `https://skillscanvas.co/passport`.

Connector URLs are not duplicate deployments and are not separate sources of truth. Canonical product HTML, sitemaps, analytics, and search signals live on the standalone domains.

## 3. Network layers

| Layer             | Responsibility                                               | Initial implementation                                                 |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Authoritative DNS | Resolve canonical and connector hostnames                    | AfeesHost zones, verified before changes                               |
| Edge and TLS      | HTTPS, WAF/CDN where available, redirects, basic rate limits | One authoritative redirect layer only                                  |
| Product origins   | Serve four independently validated builds                    | Four isolated document roots/build outputs                             |
| Identity          | Shared login and consent                                     | Later `auth.fixars.ai` using OAuth/OIDC; no broad parent-domain cookie |
| API gateway       | Route authenticated synchronous requests                     | Later `api.fixars.ai/{product}` to bounded product services            |
| Event gateway     | Route asynchronous product facts                             | Later private `events.fixars.ai` service plus queue                    |
| Inbound webhooks  | Receive narrow third-party notifications                     | Later `hooks.fixars.ai/inbound/{provider}` endpoints                   |
| Product data      | Authoritative state and append-only records                  | Separate product-owned databases and policies                          |

## 4. When to use each interaction

- Browser navigation uses canonical URLs and redirects.
- User commands and current-state reads use authenticated APIs.
- Shared login uses OAuth/OIDC.
- Server-to-server notifications use events, with webhook delivery where HTTP is the appropriate adapter.
- Browser live updates use SSE or WebSocket connections fed from product projections.
- Webhooks do not replace APIs, databases, identity, DNS, redirects, or browser realtime channels.

## 5. Event flow

1. A product validates and commits a state change in its own database.
2. The same database transaction appends an event to that product's outbox.
3. An outbox dispatcher publishes the event to the Fixars event gateway/queue.
4. The gateway records delivery state and routes the event to approved consumers.
5. Consumers process the event idempotently and update their own local projection or workflow.
6. Fixars.ai updates a read-only ecosystem projection for discovery and activity display.
7. Failed deliveries retry with exponential backoff and jitter, then move to a dead-letter queue for controlled replay.

No consumer may treat receipt of an event as proof that another consumer completed its work.

## 6. Initial event catalogue

The machine-readable catalogue is in `contracts/events/catalog.v1.json`. The first contracts cover:

- ConceptsNexus concept certification and required-skill publication.
- SkillsCanvas verified-skill and passport updates.
- CollaBoard capsule creation, artifact approval, and milestone approval.
- VestDen diligence updates and restricted escrow-release requests.

Event names use reverse-DNS style identifiers and explicit versions. Payloads carry identifiers and necessary facts, not whole product records or unnecessary personal data.

## 7. VestDen consequence boundary

Events may start a VestDen diligence or verification workflow. They must not directly release escrow, create a position, initiate a payment, or mark a payout successful.

A consequence-bearing VestDen workflow must:

1. Verify the event signature and replay window.
2. Deduplicate the event ID.
3. Fetch authoritative records through authenticated APIs.
4. Recalculate server-owned gates and values.
5. Apply legal, policy, and approval controls.
6. Write an append-only decision record.
7. Call a regulated provider only from an authorised server-side workflow.
8. Reconcile the provider's independently verified response/webhook before changing financial state.

## 8. Webhook delivery requirements

- HTTPS only.
- Per-producer or per-endpoint signing credentials.
- Signature verification over the exact raw request body.
- Signed timestamp and bounded replay window.
- Unique event IDs and idempotent consumers.
- Quick `2xx` acknowledgement after durable queueing, not after lengthy business logic.
- Exponential retry with jitter, dead-letter storage, and audited replay.
- Explicit event subscriptions; no receive-everything endpoints by default.
- Payload-size limits, schema validation, rate limits, and structured security logs.
- Separate sandbox and production endpoints, secrets, queues, and data.
- Event metadata must not contain secrets or sensitive personal information.

## 9. Deployment phases

### Phase A: current static products

- Produce four isolated frontend build outputs.
- Create four hosting roots.
- Attach canonical domains and HTTPS.
- Configure subdomain and path redirects.
- Keep webhook/event runtime disabled.

### Phase B: first product backends

- Define product-owned databases and APIs.
- Implement shared event-envelope validation.
- Add transactional outbox tables and dispatchers.
- Operate one internal queue and event gateway.
- Build Fixars.ai read-only projections.

### Phase C: inbound and outbound webhooks

- Add provider-specific inbound endpoints only when a provider is selected.
- Add signed internal webhook delivery for consumers that cannot use the queue directly.
- Add delivery monitoring, replay tooling, and contract tests.

### Phase D: regulated VestDen integration

- Complete legal and provider review.
- Implement server-verified financial state and reconciliation.
- Test failure, duplication, replay, reordering, and rollback cases before enabling consequence-bearing workflows.

## 10. Go-live gates

- DNS zone exports and rollback values captured.
- Exactly one redirect layer selected.
- All canonical and connector hostnames have valid certificates.
- Canonical redirects preserve deep paths and never loop.
- Four product builds pass desktop and 390px checks.
- Event catalogue validation passes.
- Webhook endpoints reject bad signatures, expired timestamps, duplicates, invalid schemas, and oversized payloads.
- Queue, retry, dead-letter, replay, and audit behaviour are tested.
- No client-side code can produce authoritative cross-product scores or financial success states.
- Live URLs, status codes, certificates, canonical tags, and product identity are verified after deployment.

## 11. Immediate next work

1. Complete a read-only cPanel/edge inventory.
2. Use the four deterministic outputs generated by `npm run build:products`.
3. Prepare redirect configuration without applying it.
4. Review the event catalogue and approve the initial event names and consumers.
5. Implement only the static-domain deployment first.
6. Start the event runtime when the first authoritative product backend exists.
