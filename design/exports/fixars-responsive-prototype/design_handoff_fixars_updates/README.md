# Handoff: Fixars responsive prototype — incremental updates

## Overview
This bundle packages the **updates made in this design session** on top of the existing Fixars prototype/design-system repo. It is structured as a *delta*: your repo already contains the baseline superapp, mobile, and onboarding templates — this README lists exactly what changed and where, so you can merge the positive updates without touching anything else.

## About the design files
The files here are **design references created in HTML** — working prototypes showing intended look and behavior, not production code to ship directly. Recreate the changes in your target codebase's environment (React etc.) using its established patterns; if the repo's HTML prototypes are themselves the artifact, the files here can be diffed/merged directly against them.

## Fidelity
**High-fidelity.** Colors, type, spacing, and interactions are final and use the Fixars design-system tokens throughout. Recreate pixel-perfectly.

## Baseline → what's in this bundle
Bundle contents map 1:1 onto the repo baseline:

- `Fixars Superapp.html` ← baseline `templates/superapp/index.html`
- `v2/data.js`, `v2/pages.js`, `v2/app.js` ← baseline `templates/superapp/v2/`
- `Fixars Mobile.html` ← baseline `templates/mobile/index.html`
- `Fixars Onboarding.html` ← baseline `templates/onboarding/index.html`

Everything not listed under "Changes" below is identical to baseline. Safest merge path: diff each bundled file against its baseline counterpart and cherry-pick the hunks described here.

## Changes (the deltas to merge)

### 1. SkillsCanvas: Cards ⇄ Table view (new feature)
An "Executive Precision" data-table view of the talent directory, derived from a Google Stitch exploration, alongside the existing cards.

**`Fixars Superapp.html`** — new CSS block, inserted just above the `/* Mobile */` section. Selectors: `.table-wrap`, `.table-scroll`, `.data-table` (th/td/hover), `.status-cell`, `.table-foot`, `.pg` (pagination buttons). Key specs:
- Table wrapper: white `--paper`, 1px `--ink-100` border, `--r-lg` (14px) radius, `--shadow-sm`, `overflow:hidden`; horizontal scroll wrapper with `min-width:760px` table.
- Headers: 10px / 600 / uppercase / 0.08em tracking / `--ink-400`, 14px 16px padding, hairline bottom border.
- Cells: 13px, 13px 16px padding, `--ink-100` row hairlines, row hover `--ink-50`, cursor pointer.
- Status cell: 7px dot (`currentColor`) + 12px/600 label. Colors: available `--success`, on-project `--warning`, unavailable `--ink-400`.
- Pagination: 30px square buttons, 8px radius, `--ink-200` border, JetBrains Mono digits; current page `--navy-900` bg, white text.
- Mobile (≤820px): `.table-foot { justify-content:center }`.

**`v2/data.js`** — talent records extended with `status: 'available'|'busy'|'off'` and `last: '2h ago'` fields (5 records).

**`v2/pages.js`** —
- New `STATUS_META`, `talentRow(t)`, `talentTable(items)` renderers (after `tierBadge`). Rows open the existing `talentDetail` modal; footer shows "Showing 1–5 of 4,820 talents" with pagination buttons wired to toasts (prototype-only).
- `LIST_SOURCES.skills` gains `table: talentTable`.
- `subAppPage()` accepts a `views` flag; when set it renders a Cards/Table `.segment` toggle (`#view-toggle`) plus a "↓ Export" ghost button next to the filters. SkillsCanvas page passes `views: true`.

**`v2/app.js`** — `renderList()` reads `wrap.dataset.view`; `'table'` renders `src.table(items)` and drops the `list-grid` class, `'cards'` restores it. Search + category filters apply in both views. `#view-toggle` click handler swaps the view and active state. Also binds `[data-toast]` inside rendered lists.

### 2. Personalization: user renamed to Ade
- `v2/data.js`: `user.name` `'Amaka Obi'` → `'Ade Obi'` (greeting, sidebar, profile all derive from it).
- `Fixars Superapp.html`: sidebar footer name literal → `Ade`.
- `Fixars Mobile.html`: greeting `Hey, Amaka 👋` → `Hey, Ade` (emoji removed per design system — no emoji), profile name → `Ade Obi`.

### 3. Color overrides (user-directed)
All via existing tokens, inline styles:
- Sidebar footer avatar: `background-color: var(--ink-700)`.
- Topbar avatar: `background-color: var(--navy-700)`.
- Topbar "+ New" button and home "+ Submit idea" button: `background-color: var(--navy-600)` (overrides default `--blue-600` primary fill).

### 4. Cross-surface navigation (new links)
- **Mobile → others** (`Fixars Mobile.html`): Settings menu gains "Open on desktop" → `Fixars Superapp.html` and "List a new skill" → `Fixars Onboarding.html` (styled as existing `.item` rows, Lucide-style inline SVG monitor icon, cyan S glyph chip). Profile "Verified skills" header action → "+ List a skill" linking to onboarding (replaces the "Manage" button).
- **Superapp → others** (`v2/pages.js`, settings page): Preferences card gains two rows — "Mobile app · Open preview →" and "Activation flow · Run again →" (links in `--blue-600`).
- **Onboarding → others** (`Fixars Onboarding.html`): final screen now offers "Enter Fixars →" (primary, → superapp `#profile`) and "Open on mobile" (ghost, → mobile `#profile`) side by side; centered flex row, 10px gap.
- Asset paths repointed from `../../assets/…` to local `assets/…` in Superapp + Mobile; onboarding exit link repointed from `../superapp/index.html#profile` to the local file.

Deep links: both apps honor `#page` hashes (`#wallet`, `#profile`, …).

## Interactions & behavior (new feature only)
- View toggle: instant re-render, active segment state; filter + search state preserved across view switches.
- Table rows: hover `--ink-50`, click opens talent detail modal (same as cards).
- Pagination/Export: toast feedback only (prototype).
- ≤820px: table scrolls horizontally inside its card; footer centers.

## Design tokens
No new tokens. Everything uses the existing Fixars system: `--paper --ink-50…900 --navy-600/700/900 --blue-600 --success --warning --skills --skills-bg --r-lg --shadow-sm`; Space Grotesk display, Inter body, JetBrains Mono numerals.

## Assets
`assets/logo/fixars-mark.png`, `fixars-mark-white.png` — unchanged copies from the repo's `assets/logo/`. No new assets.

## Files in this bundle
- `Fixars Superapp.html` — desktop superapp shell (+ table CSS, name/color edits)
- `v2/data.js` — data layer (+ status/last fields, Ade)
- `v2/pages.js` — page renderers (+ talentTable, view toggle markup, settings links)
- `v2/app.js` — app logic (+ view-toggle wiring in renderList)
- `Fixars Mobile.html` — mobile app (+ cross-links, name edit)
- `Fixars Onboarding.html` — activation flow (+ dual exit CTAs)
- `assets/logo/` — logo marks referenced by the pages

## Merge guidance
1. Diff bundle files against `templates/{superapp,mobile,onboarding}` in the repo.
2. Take deltas 1 (table view) and 4 (cross-links) wholesale — they're additive.
3. Deltas 2–3 (name, avatar/button colors) are content/preference edits — take or leave per surface.
4. Watch the asset-path hunks: keep whichever relative paths match your repo layout (`../../assets/…` in-repo vs `assets/…` here).

## Screenshots
In `screenshots/` — captured from the bundled prototypes:
- `superapp-01-home.png` — home dashboard (Ade greeting, navy CTAs)
- `superapp-02-skillscanvas-cards.png` — SkillsCanvas, cards view
- `superapp-03-skillscanvas-table.png` — SkillsCanvas, **new table view** (delta 1)
- `superapp-04-wallet.png` — wallet
- `superapp-05-profile.png` — profile / FCS
- `mobile-01-home.png` — mobile home
- `mobile-02-profile.png` — mobile profile ("+ List a skill" link)
- `mobile-03-settings.png` — mobile settings (cross-links, delta 4)
- `onboarding.png` — activation flow entry
