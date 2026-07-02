# Fixars — Launch‑Readiness Review

**Reviewer lens:** 10×product/UX/eng review from the POV of an ordinary Nigerian user (Lagos/Abuja/Kano), cross‑referenced against the Fixars Comprehensive PRD v2.0 and the four sub‑app PRDs (vestDen, ConceptNexus, CollaBoard, SkillsCanvas).
**Date:** 2026‑06‑11 · **Build reviewed:** `main` (this repo; the source of the `fixars-production` deploy).
**Addendum (2026‑07‑02):** strategic positioning has since been adopted in [`strategy-sovereignty.md`](./strategy-sovereignty.md) and [`fcl-spec.md`](./fcl-spec.md); this review's findings and priorities are unchanged.

> **Note on method.** The live URL `https://fixars-production.up.railway.app/` is not reachable from this environment (blocked by the execution sandbox's network allowlist — returns `403 Host not in allowlist`). Because production is built from this repository, the review was performed by running the production codebase locally and auditing every route, modal and component, then mapping findings to the PRD goals. Anything network‑specific to the live deploy (TLS, CDN, uptime, real env vars) still needs a pass on the actual URL.

---

## 0. Verdict

**Not launch‑ready as a public product. Ship‑ready as a high‑fidelity demo/prototype.**

The redesign (design system, theming, command palette, stake‑flow UX, responsive shell) is genuinely strong and demos the vision well. But **the entire application is a front‑end mock**: `isSupabaseConfigured()` is hard‑coded to `false` ("Force disabled for demo purposes"), so **auth, data, wallet, payments and notifications are all `localStorage` simulations**. The PRD's *Must‑Have* foundations — SSO, KYC, escrow, payments, DMs (FR‑001/002/006/010/011/012) — do not exist as real systems.

For a Nigerian audience the PRD itself calls "scarred by Ponzi schemes" (Experience Quality #3 "Trustworthy"), publicly launching an **investment app with simulated money and returns language** is both a trust and a **regulatory** hazard. The path to launch is less about UI polish (largely done) and more about **building the real platform underneath it** and **sequencing the regulated pieces correctly**.

Priorities below are tagged **P0 (blocker)** → **P3 (nice‑to‑have)**.

---

## 1. P0 — Launch blockers

### 1.1 There is no backend — everything is a browser mock
- `src/lib/supabase.js` → `isSupabaseConfigured()` returns `false` unconditionally. `AuthContext`, `DataContext`, `WalletContext`, `SocialContext` all branch to `localStorage`.
- **Consequences:** anyone "signs in" with any email/password; there is no real account, no server persistence, no multi‑user, no cross‑device, no real notifications. Clearing the browser wipes the "account". Two users never see each other.
- **Action:** stand up the real backend (Supabase/Postgres or the PRD's microservices), wire auth + data + realtime, and flip the flag. Until then nothing else on this list is truly testable.

### 1.2 Money is fake — but the UI sells real investing
- Wallet balance, transactions, and the **stake flow** are `localStorage` numbers. There is **no payment rail** (PRD *Must‑Have* FR‑011: bank/card/**mobile money**), **no escrow** (FR‑010), **no Paystack/Flutterwave** (PRD §9.3), **no Stripe diaspora flow** (vestDen PRD ID‑08).
- vestDen shows "target IRR / projected value / 2–4× target return / Stake ₦X" against fake balances. A user can "stake" and see a campaign "funded" with money that doesn't exist.
- **Action (P0):** do **not** expose any real‑money or returns‑bearing surface publicly until: real payments (Paystack + at least one mobile‑money option — OPay/PalmPay/MoMo), a real **escrow partner** integration (vestDen PRD §4.1), and the legal structure below are in place.

### 1.3 Regulatory exposure (SEC / CBN / NDPR) — highest‑risk item
- Investment/return language without a securities structure, risk disclosures, or investor suitability is an SEC‑Nigeria problem; holding/representing funds is a CBN problem. The PRD flags this (Risks: "Regulatory uncertainty (SEC, CBN)", Open Question "What regulatory structure for InvestDen staking products?").
- No **NDPR** consent, no real **Terms**/**Privacy** (the `/terms` and `/privacy` routes are one‑paragraph placeholders).
- **Action:** legal counsel before any vestDen public exposure; real T&C/Privacy/risk disclosures; NDPR consent capture at signup; "demo/simulated" watermarking if any money UI ships pre‑license.

### 1.4 No identity/KYC, no phone auth
- PRD *Must‑Have* FR‑002: tiered KYC (Phone T1 → NIN/BVN T2 → Full T3) via Smile ID/Dojah. **None exists.** Login/Signup collect only name/email/password — **no phone number, no OTP, no NIN/BVN, no social login** (PRD §9.1 lists Google/Apple/Facebook/biometric).
- For Nigeria, **phone‑first + OTP** is table stakes; many users don't lead with email.
- **Action:** phone signup + OTP, email verification, KYC tiers gating transaction limits (vestDen PRD §6 limits), social login.

### 1.5 Messaging is advertised but doesn't exist
- `/messages` simply renders the **Activity Feed** (`<Route path="/messages" element={<Feed />}/>`), and the topbar message icon links there. DMs are *Must‑Have* FR‑006 (E2E encrypted).
- **Action:** build basic DMs, **or** remove every "Messages" entry point until it exists (shipping a link that lands on the wrong screen reads as broken).

### 1.6 Data is not real and not credible
- Seed users are **non‑Nigerian**: *Sarah Chen, Marcus Williams, Emily Rodriguez, David Kim, Lisa Park, James Wilson, Jessica Lee, Michael Torres, Anna Kowalski*. For a "Nigeria → Africa" product this instantly breaks trust — a Lagos user sees an "African innovation" platform populated by American names.
- Feed/notification timestamps are **stale** (Jan 2026 content shown in June 2026).
- **Action:** until real users exist, seed with Nigerian personas (the PRD's own — Chinedu, Adaeze, Ibrahim, Funmilade, Chidi, Kemi, Emeka…), Nigerian locations, and recent timestamps.

---

## 2. P1 — Trust & credibility (the Nigerian‑user lens)

| # | Finding | Why it matters here |
|---|---|---|
| 2.1 | **Currency leftovers** — e.g. notification seed `"New stake: $2,500 on AI Recipe Generator"` (`SocialContext`). | A naira‑market product showing `$` reads as foreign/untrustworthy. (Most `$`→`₦` fixed in the redesign; sweep for the rest.) |
| 2.2 | **No visible trust scaffolding** the PRD promises: escrow status, KYC‑tier badge, verified badges, dispute/refund, transparent track record. | The PRD's entire thesis is *manufactured trust* for a Ponzi‑wary market. Right now "Verified" tags are cosmetic. |
| 2.3 | **Returns realism & disclaimers.** "2–4× target return", "projected value ₦50K–₦100K". | Implied returns without "not investment advice / capital at risk / not guaranteed" prominently is dangerous and likely non‑compliant. |
| 2.4 | **FCS definition conflict.** App shows "FCS 300–850" (credit‑score styling, set in the redesign), but the PRDs define the unified **reputation score as 0–1000** (Comprehensive §9.1; SkillsCanvas §6). | Decide: is "FCS" a 300–850 credit score *or* the 0–1000 reputation score? One canonical model, one scale, everywhere. |
| 2.5 | **Empty/zero states feel broken** for a new user (Profile shows "Skills Listed 0 / Board Member 0", etc.) with no guided next step. | First‑run experience should onboard, not present a wall of zeros. |

---

## 3. P1 — Brand & narrative consistency

| # | Finding | Action |
|---|---|---|
| 3.1 | **The flagship app has three names.** PRD *Comprehensive* says **InvestDen** throughout; the sub‑app PRD says **VestDen**; the app uses **vestDen / VestDen / vestden** (49/19/8 occurrences). | Pick ONE canonical name + casing and apply across PRDs, UI, routes, copy. (Same issue: **CollaBoard / Collaboard / collaboard** = 12/15/49.) |
| 3.2 | **Two different logos.** Sidebar/mobile use the gear‑hook mark; the public Header, **Login** and **Signup** use a generic rounded "F". | Unify on the real mark everywhere (the redesign already nudged the mark to indigo — apply it to the auth/header surfaces too). |
| 3.3 | **Split narrative.** Splash = "operating system for African innovation"; Login/Signup = "the future of **connected productivity** … innovators **worldwide**". | Align every surface to the African‑innovation positioning; "worldwide/productivity" copy undercuts the wedge. |
| 3.4 | **`⌘K` shown to a Windows/Android‑majority audience** (topbar + palette hint). | Show `Ctrl K` on non‑Mac (detect platform) or use a neutral icon. |
| 3.5 | Footer/marketing copy still generic ("The future of connected productivity. Invest…"). | Rewrite to the PRD voice (trust, escrow, Nigeria‑built). |

---

## 4. P2 — Feature completeness vs the PRD (the app is a thin slice of v2)

The current app is a **navigational prototype** of the vision. Each pillar is missing most of its v2 PRD surface:

- **ConceptNexus** — has: idea cards, up/down votes, a score, "Launch Project". **Missing:** the 5‑criteria validation framework (Problem/Solution/Market/Team/Differentiation), validator flow + eligibility, **AI (Gemini) feedback within 60s** (CN‑02), lifecycle states (draft→in_review→validated/rejected→funded), corporate challenges, one‑click → vestDen pre‑fill.
- **vestDen** — has: campaign cards, a simplified wallet stake, funded/backers counters. **Missing:** milestone‑based **escrow**, **conviction (Polymarket‑style) staking markets**, **AI due‑diligence report**, **diaspora Stripe** FX, investor list, refund‑on‑miss, KYC limits.
- **CollaBoard** — has: board list + kanban detail. **Missing:** one‑click import from a funded campaign, **investor read‑only dashboard** (budget burn, milestone %), contracts/talent hire, the **skill‑validation gate**, AI task breakdown/risk alerts, the **foundational toolbox** (legal/equity/NDA/governance templates), **non‑tech domain interfaces** (agriculture/finance/healthcare/consulting), compliance/grant reporting.
- **SkillsCanvas** — has: talent cards, skill chips, contact/booking, list‑skills. **Missing:** **adaptive, proctored assessments** with Beginner→Expert levels, the **5‑factor search ranking**, contract offers, enterprise bulk assessments/dashboards, mentorship marketplace, AI CareerCoPilot.
- **Cross‑app journey** (the core thesis ideate→fund→assemble→execute→deliver) is only partially wired (idea→launch‑board exists; funding→room, milestone→escrow release, delivery→reputation do not).
- **Points/FXP** — display only. No earning rules, multipliers, redemption, or leaderboards (FR‑008/009).
- **"Resilient" qualities** (PRD Experience #4): no offline mode, low‑bandwidth path, SMS fallback, or airtime — all explicitly promised for the African context.

> This is fine for a demo, but the public‑facing copy and app launcher imply these work. Either build the MVP slice or **clearly label unbuilt areas** ("Coming soon") so users aren't misled.

---

## 5. P2 — UX, accessibility, responsiveness, performance

- ✅ Already addressed in the redesign: cohesive design system, dark/sepia themes, density/vibe, command palette, **reduced‑motion guard**, **mobile bottom‑sheet modals**, responsive shell.
- **Feed** still uses the pre‑redesign card styling (not the v2 list‑card system) — visually inconsistent with the rest.
- **Mobile‑money payment options** (OPay/PalmPay/MTN MoMo) are absent from every money surface — non‑negotiable for Nigerian conversion.
- **Accessibility pass needed:** focus‑visible coverage, color contrast in sepia/dark, `alt` text on the mark, dialog focus‑trap (the shared modal notes it relies on browser default; Radix is installed — use it), keyboard paths through the stake flow.
- **Data‑cost/perf for low‑end Android + metered data:** add skeletons/optimistic states, compress imagery, lazy‑load, and test on a throttled 3G profile and a 360 px viewport. App bundle is ~448 KB JS gzip 128 KB — fine, but verify on real devices.
- **Form robustness:** validation messages, error/empty/loading states, and "what happens on submit" need a pass once a real backend exists (today submits mutate local state only).

---

## 6. P3 — Polish / nits
- `/developers` (ApiDocs) is a public route whose endpoints return *"not implemented in demo"* — hide or label it pre‑launch.
- Naming casing cleanup (item 3.1) is also a code‑hygiene fix (routes, class names, copy).
- Time‑ago vs absolute dates inconsistent across feed/notifications.
- "Magic Link" / "Forgot password" on Login are non‑functional in mock — wire or hide.

---

## 7. Recommended launch path (aligns with the PRD's own GTM)

The PRD §13.3 already prescribes the safe sequence — **SkillsCanvas first (lowest regulatory complexity) → ConceptNexus → InvestDen (needs SEC) → CollaBoard.** The current app does the opposite by foregrounding the investment product. Recommended cut:

1. **Foundation (P0):** real backend + auth (phone OTP + email + social), real data model, NDPR consent, real Terms/Privacy. Flip the Supabase flag.
2. **Alpha/Beta surface (low regulatory risk):** **SkillsCanvas + ConceptNexus + Feed + Profile + Points**, with Nigerian seed content and DMs (or messaging removed). This matches PRD Alpha (Lagos, 500) → Beta (10k).
3. **Gate the regulated pillar:** keep **vestDen** behind a flag / "waitlist" until SEC structure + KYC tiers + Paystack/mobile‑money + escrow partner + Stripe diaspora are real and reviewed by counsel. Add risk disclaimers the moment any returns language appears.
4. **CollaBoard** real execution (escrow webhooks, investor dashboard, contracts) after vestDen funding is live.
5. **Harden:** payments reconciliation, fraud/AML monitoring (PRD risk "Fraud and bad actors"), uptime/observability, load test to the PRD's 10k concurrent / <200 ms P95 NFRs.

---

## 8. What's already strong (keep it)
- The v2 **design system & theming**, the **command palette**, **notifications popover**, the **stake‑flow UX pattern**, the **sub‑app information architecture**, and the **responsive/mobile shell** are well executed and on‑brand. The *experience scaffolding* is largely launch‑grade — it's the *platform beneath it* that isn't.

---

### Appendix A — Quick "must‑fix before any public exposure" checklist
- [ ] Real auth + backend (disable the mock); phone OTP + email verification
- [ ] KYC tiers (NIN/BVN via Smile ID/Dojah) gating limits
- [ ] Real payments: Paystack + ≥1 mobile money (OPay/PalmPay/MoMo); wallet funded from real sources
- [ ] Escrow partner integration before any staking is real
- [ ] Legal: SEC review of vestDen, real Terms/Privacy/risk disclosures, NDPR consent
- [ ] DMs built, or all "Messages" entry points removed
- [ ] Nigerian seed data + recent timestamps; remove Western placeholder names
- [ ] One canonical app name/casing + one logo across all surfaces
- [ ] Resolve FCS (300–850) vs reputation (0–1000) into one model
- [ ] Currency sweep ($ → ₦), incl. notification/seed copy
- [ ] A11y + low‑bandwidth/3G + 360 px device pass
- [ ] Verify the actual `fixars-production` URL (TLS, env, uptime) — couldn't be reached from this review environment
