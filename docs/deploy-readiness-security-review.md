# Fixars — Deploy-readiness and security review

**Scope:** defensive review of [macaddy2/Fixars](https://github.com/macaddy2/Fixars) default branch `main` (commit `eb7a91d` at review time).  
**Date:** 2026-08-13  
**Reviewer lens:** deploy readiness, secrets hygiene, auth/access control, injection/XSS, supply chain, CI/CD, and production safety.  
**Method:** repository and GitHub metadata only. No exploits, payloads, or attack procedures. No live Railway session was available. Semgrep MCP was unavailable; Snyk SCA could not scan because the workspace is not a trusted Snyk folder. Dependency findings use `npm audit`.

This is Ade’s Nigeria super-app prototype (CollaBoard, SkillsCanvas, ConceptsNexus, VestDen). Treat it as a **prototype**, not a production product, unless a later change clearly wires a real backend and regulated money path.

Related product/UX review (not replaced by this document): [`docs/launch-readiness-review.md`](./launch-readiness-review.md).

---

## Verdict

**Not ready to deploy as a public product.** The repo is a high-fidelity front-end mock with multiple public publish paths; shipping it as-is would present fake money, fake users, and ungated “account” surfaces as if they were real.

A **labelled, non-indexed demo** of the UI can be shown privately. A **waitlist-only** public surface is closer to acceptable if it stays isolated from the prototype app. Do not point a custom domain, ads, or “Fixars is live” copy at the root React app until auth, persistence, payments, and legal copy are real.

---

## 1. What the app actually is

### Stack

| Layer | What is in the repo |
| --- | --- |
| Super-app (repo root) | React 19 + Vite 7 + Tailwind 4 + React Router 7 + Radix UI. Optional `@supabase/supabase-js`. Served as static files. |
| Persistence today | `localStorage` mocks. `isSupabaseConfigured()` in `src/lib/supabase.js` is hard-coded to `false` (“Force disabled for demo purposes”). |
| Schema (not live in this deploy path) | `supabase/schema.sql` + `supabase/seed.sql` — Postgres tables and RLS for a future backend. |
| AI | Optional Gemini via `VITE_GEMINI_API_KEY` in `src/lib/modelProvider.js` (browser-side). Heuristic fallback if unset. |
| Payments | Mock wallet in `src/contexts/WalletContext.jsx`. `src/lib/payments.js` has a Stripe-shaped Edge Function stub that is unused while Supabase is forced off. |
| Waitlist | Isolated app in `landing-page/`. Browser posts JSON to `POST /api/waitlist`; a worker forwards to a Google Form. |
| Corporate site | Isolated app in `group-page/`. Built and FTP-published by GitHub Actions. |
| Product marketing sites | Isolated builds in `subapps/dist-products/` for skillscanvas.co, collaboard.co, conceptsnexus.co, vestden.co. Copied by `.cpanel.yml`. |

### Entrypoints

- **Super-app:** `src/main.jsx` → `src/App.jsx`. Local: `npm run dev`. Production-shaped: `npm run build` then `npx serve dist -s` (`package.json` `start`, `railway.json`).
- **Waitlist:** `landing-page/` (Vite + worker). Documented live URL is a ChatGPT Sites host, not this repo’s Railway/Pages app.
- **Group site:** `group-page/` (static marketing).
- **Four product sites:** `subapps/` build scripts → committed `dist-products/` artifacts.
- **Design HTML:** `design-handoff/` and `design/exports/` — static prototypes with `innerHTML` rendering. Not part of the Vite `dist/` that Pages/Railway publish, unless someone hosts the raw tree.

### How it is meant to be deployed (as written)

The repo describes **several** intended surfaces, not one:

1. **Railway** (`railway.json`): build root app, serve `dist/` on `$PORT`. README says this is the app deploy path.
2. **GitHub Pages** (`.github/workflows/deploy.yml`): every push to `main` builds the **same** root app and publishes it to `https://macaddy2.github.io/Fixars/`. Repo `has_pages` is true; Pages HTTPS is enforced; no custom CNAME.
3. **cPanel** (`.cpanel.yml`): copy four product artifacts into isolated document roots under `/home/fixarsgr/`.
4. **FTP** (`.github/workflows/deploy-fixars-group.yml`): publish `group-page/dist/client/` to Fixars Group hosting using GitHub secrets.
5. **ChatGPT Sites** (`landing-page/.openai/hosting.json`): waitlist only.
6. **Architecture target** (`docs/architecture/network-event-architecture.md`): FixarsGroup.com (governance), Fixars.ai (hub/waitlist), four `.co` product domains, later `auth.fixars.ai` / `api.fixars.ai`. That network is a plan, not an implemented runtime.

There is no Dockerfile, no health-check path, no API server in the root app, and no Dependabot/security policy.

---

## 2. Findings (by severity)

### Blocker

#### B1. Public deploy would ship a fake investment product as if it were live

**Where:** `src/lib/supabase.js`, `src/contexts/AuthContext.jsx`, `src/contexts/WalletContext.jsx`, `src/components/StakeFlowModal.jsx`, `src/pages/Home.jsx`, `src/App.jsx`.

**What can go wrong:** Anyone who opens the Railway or Pages URL can “sign in” with any email/password, receive a seeded ₦284,500 wallet, and “stake” into campaigns that show target returns. The splash page claims “50K+ Active Users” and “Bank-grade Escrow”. Terms/Privacy are one-line placeholders. For a Nigeria-facing product that talks about staking, escrow, and returns, this is a trust and regulatory problem (SEC/CBN/NDPR), not just a UX gap.

**Harden:** Do not publish the root app on a public hostname. If a demo URL must exist, put it behind a password or allowlist, watermark every money screen as **simulated / not real funds**, remove returns language, and keep VestDen off the public nav. Keep the public internet on the waitlist (`landing-page/`) only.

#### B2. GitHub Pages already publishes the full prototype on every `main` push

**Where:** `.github/workflows/deploy.yml`; Pages site `https://macaddy2.github.io/Fixars/`; recent successful “Deploy to GitHub Pages” runs on `main`.

**What can go wrong:** The prototype is not only “ready to deploy” — a public copy is already being rebuilt from `main`. Search engines, candidates, and random visitors can treat `macaddy2.github.io/Fixars/` as the product. This is the same bundle Railway would serve (different `base` path only).

**Harden:** Disable the Pages workflow (or restrict it to a `demo` branch) until the app is labelled and stripped of money/auth theatre. Add `noindex` if a public demo must remain. Do not attach `fixars.ai` or a `.co` domain to this workflow.

#### B3. Auth is a client-side honour system; “private” routes are public

**Where:** `src/contexts/AuthContext.jsx` (mock login/signup writes `localStorage.fixars_user`); `src/App.jsx` (unauthenticated layout still mounts `/wallet`, `/apps/vestden`, `/settings`, `/developers`, `/feed`, etc.).

**What can go wrong:** There is no server session, no password check, no role model, and no KYC. Dashboard/Profile/Analytics redirect to login in the UI; most product surfaces do not. A visitor can use VestDen, wallet, and settings without an account. Clearing storage wipes the “account”. Two browsers never share state. This is fine for a local demo and unsafe if presented as login.

**Harden:** Until Supabase (or another IdP) is actually on, hide Login/Signup/Wallet/Stake or mark them Demo. When a real backend is enabled, add a real route gate on the server or at least a single `ProtectedRoute` and stop trusting `localStorage` as identity.

#### B4. Enabling the existing Supabase schema as-is would not be safe for money or identity

**Where:** `supabase/schema.sql` (RLS and `SECURITY DEFINER` functions); `src/contexts/AuthContext.jsx` `updateUser`; `src/lib/payments.js`; `src/lib/db/points.js`.

The schema is unused while the demo flag is false, but it is the documented production model. If someone flips the flag and applies this SQL, several policies are too open for a financial/social product:

- `profiles_select` is world-readable (emails and bios).
- `stakers_select` is world-readable (who backed how much).
- Authenticated users can insert `stakers` rows for any amount; a trigger then marks campaigns funded — no payment proof.
- Users can update their own `profiles.points` / `level` from the client (`updateUser`).
- Talent owners can update `skills.verified` themselves.
- `notifications_insert` and `activities_insert` allow any authenticated insert (`WITH CHECK (true)`).
- `conversations_insert` is unrestricted; `create_dm_conversation(...)` is `SECURITY DEFINER` and does not check that the caller is `p_user_id`. There is no `REVOKE`/`GRANT` in the file, so default execute rights may apply.
- `confirmPayment` is written to send `cardDetails` to a Supabase Edge Function if live mode is ever turned on.

**What can go wrong:** Fake funding totals, self-granted reputation, notification spam, impersonated DMs, public emails, and (if the payment stub is finished as written) card data leaving the browser toward an app-controlled function.

**Harden:** Keep the demo flag off in any public build. Before enabling Supabase: move points, verification, stake amounts, and funding status to server-only writes; lock `create_dm_conversation` to `auth.uid() = p_user_id` and revoke public execute; never accept raw card fields in app code (use a PCI-compliant hosted checkout). Re-review RLS with a second person before `supabase db push`.

---

### High

#### H1. GitHub Pages + Railway would duplicate the prototype and confuse the public surface

**Where:** `vite.config.js` (`base` is `/Fixars/` when `GITHUB_ACTIONS` or `GH_PAGES` is set, otherwise `/`); `railway.json`; `.github/workflows/deploy.yml`; architecture doc vs README.

**What can go wrong:**

- Two public URLs, same mock product, different asset prefixes. Users bookmark the wrong one; “which Fixars is real?” becomes a support and trust issue.
- Pages and Railway do **not** share `localStorage`, so the same person appears as two different demo users. That is not a data leak between hosts, but it *looks* like broken accounts.
- If Railway’s build environment ever exposes `GITHUB_ACTIONS=true`, the Railway site would request assets under `/Fixars/` and break.
- Architecture says Fixars.ai waitlist must stay isolated. Publishing the super-app on Pages (already) or Railway (configured) fights that plan and can leak prototype copy, fake balances, and Western seed names as if they were production data.
- cPanel product sites and the waitlist are separate artifacts; pointing DNS for those domains at Railway/Pages would serve the wrong app.

**Harden:** Pick one public origin per product. Recommended now: waitlist on Fixars.ai only; group site on FixarsGroup.com; product `.co` sites from `subapps/dist-products` only; **no** public Railway/Pages for the root app. If Railway is used for internal preview, do not attach the marketing domains and do not set `GITHUB_ACTIONS` in that service.

#### H2. Browser-bundled Gemini key pattern

**Where:** `.env.example`, `src/lib/modelProvider.js`. The example file correctly warns not to put a production key in the browser.

**What can go wrong:** Any `VITE_GEMINI_API_KEY` set at build time is compiled into public JS. Anyone can reuse that key, run up quota, or send prompts that include user profile/idea text to Google from the visitor’s browser.

**Harden:** Leave the key unset in Pages/Railway builds. If AI is needed in production, proxy generate calls through a server you control, restrict referrers, and never ship the key in `VITE_*`.

#### H3. Waitlist PII path is a Google Form with bypassable worker controls

**Where:** `landing-page/worker/index.js`, `landing-page/src/App.jsx`, `landing-page/README.md`.

**What can go wrong:** The worker validates JSON, has a honeypot, a body-size cap, a same-origin check, and a small in-memory rate limit. Those controls do not apply if someone posts to the Google Form URL directly (form ID and entry IDs are in the repo). The in-memory bucket is per isolate and is skipped when `cf-connecting-ip` is missing (likely on non-Cloudflare hosts such as the documented ChatGPT Sites deploy). Email, WhatsApp, campus, and course data then sit in a personal Google Sheet. README already says `privacy@fixars.ai` must be verified before production.

**Harden:** Treat the Google Form as a prototype inbox, not a system of record. For a real waitlist: store submissions in a backend you control, put rate limits in durable storage, do not publish form entry IDs, and confirm the privacy mailbox and retention story before advertising the form.

#### H4. FTP publish of the group site

**Where:** `.github/workflows/deploy-fixars-group.yml` (`SamKirkland/FTP-Deploy-Action@v4.3.5`), environment `production`.

**What can go wrong:** FTP sends the hosting password in the clear to whatever host is in `FIXARSGROUP_FTP_SERVER`. A third-party Action (tag, not a pinned commit) receives that password. `.cpanel.yml` also embeds the hosting account path `/home/fixarsgr/`, which identifies the cPanel user.

**Harden:** Prefer SFTP/FTPS or a tokenised host API. Pin the Action to a full commit SHA. Rotate the FTP password if this workflow has ever run on a forked PR or a compromised runner (this workflow is `main`-only, which is better). Remove or avoid committing the home-directory path.

#### H5. Home and product copy over-claim capabilities that do not exist

**Where:** `src/pages/Home.jsx` (escrow, 50K users, IRR); VestDen stake UI; `/developers` API playground; `/messages` renders the feed.

**What can go wrong:** Public visitors reasonably believe escrow, payments, DMs, and a live API exist. That is a product-trust failure and, for investment language, a compliance failure.

**Harden:** For any public host, replace claims with waitlist/coming-soon copy. Remove or label `/developers`. Do not link Messages until DMs exist.

---

### Medium

#### M1. Root npm production audit: 4 high (indirect / framework)

`npm audit --omit=dev` on the root app reports:

| Package | Advisory (summary) | Notes |
| --- | --- | --- |
| `react-router` 7.12.x | RSC-mode CSRF issue (GHSA-qwww-vcr4-c8h2) | App uses `BrowserRouter`, so practical exposure is likely low; still upgrade. |
| `brace-expansion` | ReDoS / memory exhaustion | Transitive. |
| `fast-uri` | Host-confusion | Transitive. |

`landing-page` and `subapps` audits were clean. `group-page` reported high `nanoid` and moderate `postcss` (build-time).

**Harden:** Run `npm audit fix` on root and `group-page`, re-test navigation, and add a CI audit job (subapps already has `npm audit --audit-level=high`). Add Dependabot or equivalent.

#### M2. CI does not gate `main` deploys

**Where:** `.github/workflows/quality.yml` uses `branches-ignore: [main]`. Pages and FTP deploy on every `main` push. Quality does not set Railway env; it builds with `GH_PAGES=true` only.

**What can go wrong:** A direct push to `main` publishes Pages without the PR quality job. Railway, if auto-deployed from `main`, is also ungated by this workflow. The Railway-shaped `base: '/'` build is not what quality tests.

**Harden:** Require the quality workflow (and a `/` base build) to pass before Pages/FTP/Railway production deploys. Protect `main` (review + status checks). Branch protection could not be verified with this token (API 403).

#### M3. Static server has no production hardening

**Where:** `railway.json` start command `npx serve dist -s`; `index.html` has a meta `X-Content-Type-Options` and referrer policy only. `sourcemap: false` is already set (good).

**What can go wrong:** `serve` does not add CSP, HSTS, frame denial, or a health endpoint. Railway restart-on-failure is not a liveness probe. SPA fallback means unknown paths still return the app shell (expected for a router, but there is no `/healthz`).

**Harden:** Put a CDN or reverse proxy in front with CSP (at least `default-src 'self'`; fonts if still on Google), HSTS, and `X-Frame-Options` / `frame-ancestors`. Add a cheap health path if Railway needs one. Keep source maps off in public builds.

#### M4. Design-handoff HTML is unsafe to host as an app

**Where:** `design-handoff/**` and `design/exports/**` use `innerHTML` with interpolated titles/names; some files load **React development** UMD builds from `unpkg.com` (SRI is present on those script tags).

**What can go wrong:** If these files are later copied onto a public host, any user-controlled string that reaches those templates becomes HTML. Development React builds also increase debug surface. They are **not** in the current Pages/Railway `dist/` artifact.

**Harden:** Do not deploy `design-handoff/` or `design/exports/`. Keep them as local design sources. If a static showcase is needed, serve the React production build with a demo banner.

#### M5. `.gitignore` does not cover all env filenames

**Where:** `.gitignore` ignores `.env`, `*.local`, and `.env.*.local`, but not `.env.production` / `.env.development`.

**What can go wrong:** A common Vite filename can be committed by mistake. No live `.env` (other than `.env.example`) is in git history from this review.

**Harden:** Ignore `.env.*` except `.env.example`. Add a secret-scanning pre-commit or GitHub secret scanning (repo has no security policy).

#### M6. Waitlist and group READMEs / package names are copy-pasted

**Where:** `group-page/README.md` still describes the waitlist and Google Form; both packages are named `fixars-early-access`.

**What can go wrong:** An operator following the group-page README could publish or re-point the waitlist form, or assume PII handling that does not apply to the corporate site.

**Harden:** Give each package its own name and README that match what it actually deploys.

#### M7. Client-side “API” and open CORS are not a current server risk — they become one if Supabase is enabled

**Where:** `src/lib/api.js` uses the anon key in the browser (normal for Supabase); there is no custom API CORS config because there is no custom API. CSRF is largely N/A for the mock. The waitlist worker rejects a mismatched `Origin` when the header is present.

**What can go wrong:** Once a real backend exists, the current client is not designed for cookie sessions or CSRF tokens. The playground will call PostgREST with whatever key is in the bundle.

**Harden:** Keep the playground off in production. Use the anon key only with tight RLS. Prefer cookie or BFF auth later rather than a long-lived key in JS.

---

### Low

#### L1. No committed production secrets found

`.env.example` uses placeholders only. Git tracks no `.pem` / `.key` / Firebase / Stripe live keys. `supabase/.temp/cli-latest` is a CLI version string (`v2.78.1`), not a credential.

**Still rotate / treat as sensitive if they were ever pasted into Railway, GitHub Environments, or a Google account:**

| Kind | File / location | Action |
| --- | --- | --- |
| Supabase URL + anon key | intended in `.env.local` / host env (`VITE_SUPABASE_*`) | Anon keys are public-by-design; rotate if a **service role** key was ever put in `VITE_*` or committed in a fork. |
| Gemini API key | `VITE_GEMINI_API_KEY` | Rotate if it was ever set on a public build. |
| FTP password | GitHub secret `FIXARSGROUP_FTP_PASSWORD` | Rotate on staff change; prefer SFTP. |
| Google Form / Sheet | form ID in `landing-page/` | Not a password, but it is a writable PII inbox — restrict Sheet sharing. |
| OpenAI Sites project id | `landing-page/.openai/hosting.json` | Not a secret; do not add API tokens beside it. |

#### L2. GitHub Actions are tag-pinned, not SHA-pinned

`actions/checkout@v4`, `actions/setup-node@v4`, `actions/deploy-pages@v4`, and the FTP Action can move under the same tag.

**Harden:** Pin to commit SHAs for production workflows.

#### L3. Quality / Pages Node 20 vs subapps Node 22 vs `.nvmrc` 20 vs `engines` `>=18`

Unlikely to break a static build; can cause “works on CI, fails on Railway” if engines diverge later.

**Harden:** One Node version in `.nvmrc`, `engines`, and all workflows.

#### L4. `JSON.parse` of `fixars_user` has no try/catch

A corrupted `localStorage` value can crash auth init. Wallet load is already guarded.

**Harden:** Catch parse errors and clear the key.

#### L5. Login redirect uses React Router `state.from` (path only today)

Not an open-redirect via query string. Keep it that way; do not later accept a full URL from `?next=`.

#### L6. Google Fonts from `fonts.googleapis.com` on all public HTML

Privacy/CDN dependency for Nigeria users on metered links; also widens CSP.

**Harden:** Self-host the three families if you add a strict CSP.

#### L7. No admin panel found

No separate `/admin` app. “Admin” appears only as a board **member role** in mock data. Settings can export/delete **local** demo data (`src/lib/ledger.js`) — appropriate for a prototype.

---

## 3. Secrets hygiene (summary)

| Check | Result |
| --- | --- |
| Committed `.env` with real values | Not found |
| Stripe / Paystack / Flutterwave live keys | Not found |
| Firebase | Not used |
| Hardcoded Supabase project URL | Placeholder only in `.env.example` |
| Hardcoded public URLs | Waitlist ChatGPT Sites host; Google Form; product `.co` / `fixars.ai` connectors; prior review mentioned `fixars-production.up.railway.app` (not in current config files) |
| `.gitignore` | Good for `.env` / `*.local`; gap for `.env.production` |

Do not commit secrets in follow-up PRs. If any real key was ever in a public Pages/Railway JS bundle, rotate that **kind** of key (Gemini, Supabase service role, FTP password) without pasting the value into chat or git.

---

## 4. Auth, CSRF, XSS, CORS (summary)

| Topic | Current state |
| --- | --- |
| Login | Mock: any password works; special emails map to seed personas. |
| Session | `localStorage` JSON user. No httpOnly cookie, no expiry, no server revoke. |
| Roles | Cosmetic board roles in mock data; no server enforcement. |
| Public vs private | Almost everything is reachable unauthenticated. A few pages redirect to `/login`. |
| CSRF | No cookie-authenticated API in the root app. Waitlist uses Origin check. Upgrade `react-router` anyway. |
| XSS (React app) | No `dangerouslySetInnerHTML` / `innerHTML` under `src/`. React text escaping applies. |
| XSS (HTML prototypes) | `innerHTML` interpolation in design-handoff — do not host. |
| CORS | Waitlist worker blocks cross-origin browser posts when `Origin` is present and mismatched. Root app has no custom API. |

---

## 5. CI/CD and deploy map

```
main push
├── Deploy to GitHub Pages     → public https://macaddy2.github.io/Fixars/   (full prototype)
├── Publish Fixars Group       → FTP → group hosting                         (if group-page/** changed)
├── Sub-app quality            → validate + rebuild dist-products            (if subapps/** changed)
└── (Railway, if project linked) → serve dist on $PORT                       (full prototype, base /)

PR / non-main push
└── Quality checks             → root build with GH_PAGES=true + landing tests
                                (does not run on main)
```

cPanel (`.cpanel.yml`) is a separate host-side hook, not GitHub Actions.

---

## 6. Production-readiness checklist

| Item | Status |
| --- | --- |
| Real auth / persistence | No (forced mock) |
| Real payments / escrow | No |
| Health check | No |
| Error monitoring | No |
| HTTPS | Pages: enforced. Railway: typical `*.up.railway.app` HTTPS (not verified here). Custom domains: architecture says pending. |
| Debug flags | Demo flag is the opposite problem: it **forces** demo mode. Good for not accidentally hitting a live DB; bad if operators think the live site is real. |
| Source maps | Off in Vite production config |
| Admin left open | No admin app; product routes are open |
| Legal / NDPR | Placeholder pages |
| Security policy / Dependabot | Absent |

---

## 7. GitHub Pages vs Railway vs waitlist (direct answer)

They **conflict as product surfaces**, they do **not** automatically share prototype data.

| Surface | Artifact | Data | Risk if all are public |
| --- | --- | --- | --- |
| GitHub Pages | Root React prototype | Browser `localStorage` on `macaddy2.github.io` | Already on; looks like the product |
| Railway | Same prototype, `base: '/'` | Separate `localStorage` on the Railway host | Second fake “production” |
| Waitlist (Sites) | `landing-page/` | Google Sheet PII | Correct public slice, if isolated |
| cPanel `.co` sites | `subapps/dist-products` | Static marketing | Fine if they do not embed the mock wallet |
| Group FTP | `group-page` | Static corporate | Fine if README/DNS stay distinct |

**Prototype data leak:** Pages/Railway do not read the waitlist Sheet or a Supabase project while the demo flag is false and no `VITE_*` secrets are baked in. The leak is **narrative and PII-of-visitors**: people type emails/passwords into a mock login (passwords are discarded, but users may reuse real ones) and may treat fake naira balances as real. Design-handoff seed names are not user PII. Waitlist PII is real if the form is used.

**Do not** point `fixars.ai` at Pages or Railway while those hosts serve the super-app. That would replace or collide with the waitlist and publish the mock wallet on the marketing domain.

---

## 8. Open questions (cannot verify from the repo)

1. **Is a Railway service still live** (`fixars-production` or another), and does it have `VITE_SUPABASE_*` or `VITE_GEMINI_API_KEY` set at build time? Those values would be inside public JS if set.
2. **Was `supabase/schema.sql` ever applied** to a shared project? If yes, the RLS issues in B4 may already apply to that project even though this frontend ignores it.
3. **Branch protection on `main`** — API returned 403 from this environment.
4. **Who can access the waitlist Google Sheet**, and is `privacy@fixars.ai` a working mailbox?
5. **cPanel / AfeesHost DNS:** are the `.co` domains and `*.fixars.ai` connectors actually attached, and to which document roots?
6. **FTP workflow:** has it run successfully, and is the server FTP or FTPS?
7. **ChatGPT Sites worker:** does that host provide `cf-connecting-ip` and isolate `/api/waitlist` the same way the worker source assumes?
8. **Whether Ade wants Pages left on** as a private demo link. If yes, it still needs a demo watermark and noindex before it is safe to share widely.

---

## 9. Suggested deploy posture (no code in this review)

**Safe now**

- Public: waitlist only (`landing-page/`), with honest “early access / not a live wallet” copy.
- Public: group corporate page, if FTP/SFTP is tightened.
- Public: static product `.co` sites from `subapps/dist-products`, with no stake/wallet simulation.
- Private: root React app for design review (local, or a locked preview).

**Not safe now**

- Public Railway or Pages of the root app as “Fixars production”.
- Custom domain on the mock super-app.
- Flipping `isSupabaseConfigured` without a RLS and payments rewrite.
- Any real-money or returns-bearing UI.

---

*End of review. This document is analysis only; it does not change application code.*
