# Handoff: Fixars Super-app — Web Dashboard (Prototype v2)

## Overview
Fixars is a super-app for African innovation: users validate ideas (**ConceptNexus**), fund them (**vestDen**), execute them in escrowed sprints (**CollaBoard**), and staff teams with verified talent (**SkillsCanvas**) — all sharing one identity, wallet, and reputation system (**FCS — Fixars Credit Score**, range 300–850).

This package contains the approved **v2 web prototype**: an 11-screen single-page dashboard with working navigation, command palette, notifications, live list filtering, a complete stake flow, and theme/density variants.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to copy directly**. The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, etc.) using its established patterns and libraries. If no frontend environment exists yet, a sensible default for this product is **React + TypeScript** with a token-based styling solution (CSS variables or Tailwind config mapped to the tokens below), since the prototype is already structured as data → page renderers → app logic.

That said, the prototype JS is intentionally structured to be a faithful behavioral spec:
- `v2/data.js` — all data models and seed data (treat as API response shapes)
- `v2/pages.js` — one render function per screen + card components
- `v2/app.js` — routing, command palette, notifications, filtering, modal flows

## Fidelity
**High-fidelity.** Colors, typography, spacing, radii, shadows, copy, and interactions are final design intent. Recreate pixel-perfectly using the codebase's component library, mapping the design tokens below into the existing theme system.

## Architecture at a Glance
- **Shell**: fixed dark-navy sidebar (collapsed 64px rail → expands to 240px on hover) + sticky translucent topbar + scrollable content column (max-width 1400px, 32px padding).
- **Routing**: hash-based in the prototype (`#home`, `#invest`, …). 11 routes: `home, apps, feed, wallet, analytics, concept, invest, collab, skills, profile, settings`.
- **Mobile (≤820px)**: sidebar/topbar hidden; sticky mobile header + fixed bottom tab bar (5 tabs: Home, Apps, Feed, Wallet, Profile).
- **Theming**: 3 themes (light / sepia "dim" / dark) + 3 densities + 3 "vibes" applied via `data-theme`, `data-density`, `data-vibe` attributes on `<body>`, all driven by CSS variables. Light + cozy + expressive is the shipping default.

## Screens / Views

### 1. Home (`#home`)
- **Purpose**: daily dashboard — greeting, key personal stats, app launcher, continue-where-you-left-off, wallet, activity.
- **Layout**: page head (title left, primary CTA right) → 4-col stat strip → two-column split `1.5fr 1fr` (left: 2×2 sub-app tiles + 2 "continue" cards; right sidebar: wallet card + activity card).
- **Components**:
  - **Greeting eyebrow**: time-aware ("Good morning, Amaka"), 11px uppercase, letter-spacing 0.12em, color `--ink-400`.
  - **Page title**: Space Grotesk 32px/1.1, weight 500, letter-spacing −0.025em.
  - **Stat card**: white, 1px `--ink-100` border, radius 14px, padding 18px. Label 11px uppercase `--ink-400`; value Space Grotesk 26px; trend line 11px (green `--success` for up). Each card has a 72×30px sparkline (2px stroke polyline) pinned bottom-right, hidden on mobile. Expressive vibe adds a 2px top gradient bar (blue→violet).
  - **Sub-app tile**: white card, 3px top accent bar in app color, 32px app glyph square (radius 8px), name Space Grotesk 16px, tagline 12px `--ink-500`, footer with JetBrains Mono 11px metric + animated arrow (`→` translates 4px right on hover). Hover: border `--ink-300`, translateY(−2px), shadow-md.
  - **Wallet card**: gradient `135deg, #0A1628 → #1B2B44`, radius 14px, padding 24px, decorative radial blue glow top-right. Balance JetBrains Mono 32px. 4 action buttons in a grid (Stake / Send / Add / More) — white 10% bg, "Stake" is solid white with navy text.
  - **Activity card**: rows of 32px colored avatar + 13px body + 11px meta, separated by `--ink-100` hairlines.

### 2. Apps (`#apps`)
- 2×2 grid of large sub-app cards (min-height 220px) with 44px glyphs, taglines, blurbs and JetBrains Mono metrics. Each navigates to its sub-app.

### 3–6. Sub-app pages (`#concept`, `#invest`, `#collab`, `#skills`)
All share one template:
- Page head: 36px app-colored glyph square + uppercase tagline eyebrow + title + mission line + app-colored CTA button (violet/emerald/coral/cyan).
- 4 stat cards.
- Toolbar: search input (flex, white, radius 10px; focus ring = `--blue-500` border + 3px `--blue-50` halo) + segmented filter control (pill group, 3px padding container `--ink-50`, active segment white with shadow-sm).
- **2-col card grid, filtered live**: typing in search and clicking segments must filter the list instantly. Zero results shows an empty state (icon, "Nothing matches", explanation, "Clear filters" ghost button).
- **Card types**:
  - *Idea card* (concept): status tag (Submitted=gray / In Validation=amber / Validated=green), score "84/100" in mono, title 17px Space Grotesk, desc 13px, footer "by Author · N reviewers".
  - *Campaign card* (invest): "Funding now"/"Fully funded" tag, days-left mono, progress bar (6px, emerald fill), "₦8.4M / ₦12M · 70%", footer "14.2% target IRR · 428 backers".
  - *Project card* (collab): status tag (Active=coral / In review=amber / Done=green), overlapping 26px team avatars (−8px margin, 2px paper border), escrow amount in mono.
  - *Talent card* (skills): 48px gradient avatar, name + role + location, Verified/Unverified tag, skill chips (cyan tint), rate + FCS in mono, projects count.
- Clicking any card opens its **detail modal** (see Interactions).
- Filters per app: Concept `All/Submitted/In Validation/Validated` · Invest `All/Funding now/Closing soon(≤14d)/Funded(100%)` · Collab `All/Active/In review/Done` · Skills `All/Engineering/Design/Data/Operations`.

### 7. Feed (`#feed`)
- Composer card: 36px avatar + auto-growing textarea + footer row of 4 toggleable app chips (active = filled with app color) + "Post" primary button. Posting prepends a feed card ("just now") and clears the input; empty post shows a toast prompt.
- Filter segment: All / Following / Trending (trending = sorted by likes).
- Feed card: avatar + name + app tag chip + meta line; 14px/1.55 body; action row with SVG icons — like (fills + turns `--danger` red when liked, count increments), comment count, save (fills + turns blue, label flips to "Saved"), share (right-aligned, copies link toast).

### 8. Analytics (`#analytics`)
- 4 KPI stat cards (GMV ₦16.3M, MAU 38,420, Cross-app users 41%, Avg FCS 612).
- **Monthly volume bar chart**: 12 bars, blue gradient fill (`--blue-600`→`--blue-400`), radius 5px top, mono month labels under each, hover brightens.
- **Volume by sub-app donut**: SVG ring (36 viewBox, r 15.9, stroke-width 3.4, rotated −90°) with 4 app-colored segments + legend rows (8px square dot, label, mono %). Split: vestDen 46 / CollaBoard 31 / SkillsCanvas 15 / ConceptNexus 8.
- **Idea → impact funnel**: 5 rows, grid `220px 1fr 56px`; 18px track `--ink-50` with app-colored fill bar sized by %; mono count right-aligned. (428 submitted → 89 validated → 41 funded → 27 shipped → 24 staffed.)
- Export button (ghost) top-right.

### 9. Wallet (`#wallet`)
- Title shows live balance. Wallet card (as Home) + transactions list (signed amounts: green `+₦60,000` mono right-aligned, source app + time meta).
- **FCS card** (right column): 120px SVG ring gauge (green, dasharray = score%), big "742" + "Excellent · 300–850". Below, the 5 weighted FCS components as key-value rows with their weights in small mono: Payment history 30% (A+), Project performance 25% (A), Activity depth 20% (B+), Tenure & stability 15% (A), Network quality 10% (A−), plus Trust radius ₦1.2M.
- **Fixars Pro upsell card**: dark navy, white CTA "Upgrade · ₦2,500/mo".

### 10. Profile (`#profile`)
- Left: verified skills list (name + level + verification source, green mono score) and 3 recent project cards.
- Right: centered identity card (88px avatar, name, location, Verified + FCS tags, 3-up counters: Shipped 14 / Stakes 9 / Followers 2.1k) and an AI-suggestion card ("Add TypeScript… +₦85k/mo") with an "+ Add skill" CTA.

### 11. Settings (`#settings`)
- Account card (name, phone, email, KYC tier "Tier 3 · Full" in green, payout account).
- Security & Notifications cards: rows of label + sublabel + **toggle switch** (40×23px pill; off `--ink-200`, on `--success`; 18px white knob translates 16px; .18s ease). Toggling shows an Enabled/Disabled toast.
- Preferences card: language, currency.

## Global Components

### Command palette (⌘K)
- Opens from topbar search box, mobile search icon, or ⌘/Ctrl+K. Centered card (max-width 560px, radius 16px) over a blurred scrim, positioned 12vh from top.
- Searches **pages + ideas + campaigns + projects + talent** (max 9 results), grouped with uppercase group headers ("Go to", "Ideas", "Campaigns"…). Each row: 26px colored glyph square, bold label, muted sub right-aligned.
- Full keyboard support: ↑↓ moves selection (`--ink-50` highlight), Enter opens (navigates or opens that item's detail modal), Esc closes. Footer shows key hints in mono kbd chips. Empty query lists all pages; no matches shows a friendly empty row.

### Notifications popover
- Anchored under the topbar bell (fixed, 360px, max-height 430px; full-width on mobile). Bell shows a red dot only while unread items exist.
- Header: "Notifications" + "Mark all read" link (or "All caught up").
- Item: 32px colored avatar, 12.5px rich text, 10.5px meta, blue unread dot; read items drop to 66% opacity. Clicking an item marks it read. Closes on outside click or Esc.

### "+ New" create menu
- Primary button in topbar opens a 250px popover with 4 entries (Submit an idea / Create a stake / Create a board / List a skill), each with app glyph + sublabel; opens the matching modal.

### Modals
- 520px max-width card, radius 20px, 3px app-colored top accent bar, header (title + 12px lede + ✕), body, footer (Cancel ghost + app-colored primary). On mobile: bottom sheet (top corners 18px, slides to bottom edge). Scrim `rgba(10,22,40,.5)` + 4px blur. Esc and scrim-click close.
- **Stake flow (key flow — implement fully)**: IRR banner (emerald tint, big mono IRR + funded/days/backers) → amount input (numeric, mono) → quick-amount chips (₦10k/25k/50k/100k, selected chip fills emerald) → source select (Wallet shows live balance) → **live projected-return line** (`amount × (1 + IRR)` over 12 months, "not guaranteed" disclaimer). Confirm: validates amount > 0 and ≤ wallet balance (error toasts), then deducts wallet, increments campaign funded/backers, closes, toasts success, and refreshes any visible balances/lists.
- **Idea detail**: SVG score ring (violet) + verdict line ("Ready for vestDen" green if score ≥85, else "Needs N more points" amber) + AI-feedback banner (`--ink-50`). Footer CTA: "Graduate to vestDen →" if ready, else "Review this idea".
- **Campaign detail**: progress bar, KV rows (backers/IRR/days/operator FCS), milestone list (green check circles, amber in-review ring, gray upcoming), "Stake now" chains into the stake modal with that campaign.
- **Project detail**: escrow banner (coral tint), released progress, weekly task list (colored square status dots, done = struck-through).
- **Talent detail**: avatar + tags, KV rows (rate, projects, avg delivery "+2 days early" green, response time), skill chips, footer "Message" + "Hire to a board".
- **Submit idea**: title (required — focus + toast if empty), problem textarea, pathway select, stake-to-attach input, help banner. Submitting prepends the idea (status "Submitted") to ConceptNexus and navigates there.

### Toast
- Fixed bottom-center, navy pill, white 13px text with green check icon; slides up, auto-dismisses ~2.6s. Used for every simulated action.

## Interactions & Behavior
- **Sidebar expand**: 64px → 240px on hover, .22s ease. Icon positions are **constant** (centered in the 64px rail: items `padding:10px` + sidebar `padding:12px` = icon left edge at 22px); labels/badges fade in (opacity .15s with .08s delay). Active item: white 10% bg; when collapsed, a 3px left edge bar in white/app color. Sub-app nav items are tinted (violet/emerald/coral/cyan at 85% white-mix).
- **Page transitions**: content slides up 10px over .28s `cubic-bezier(.2,.7,.3,1)`. **Important**: animate transform only — never start from `opacity:0` (breaks prerendering/captures). Wrap all entrance animations in `@media (prefers-reduced-motion: no-preference)`.
- **Hovers**: cards lift (translateY −2px + shadow); buttons brighten 8% or darken (primary → `#1745CC`); icon buttons get `--ink-50` bg.
- **Focus**: `:focus-visible` 2px `--blue-500` outline, 2px offset. Inputs get blue border + 3px `--blue-50` halo.
- **State sync**: wallet balance, campaign funding, likes, notifications and idea lists are shared state — any mutation re-renders every visible occurrence.
- **Esc** closes (in priority order) palette, modal, popovers.

## State Management
- `wallet: number` (kobo/naira), `points`, `user {name, initials, fcs, loc}`.
- Collections: `feed[]` (liked/saved flags), `ideas[]`, `campaigns[]` (funded/target/irr/backers/days), `projects[]` (escrow, milestones "2/4", status), `talents[]`, `notifications[]` (unread flag), `transactions[]`, `analytics {gmv[], split[], funnel[]}`.
- See `v2/data.js` for exact field shapes — treat these as the API contract.
- Triggers: stake confirm (wallet−, campaign+), idea submit (ideas unshift), post (feed unshift), like/save toggles, notification read, filter/search params (local per page).

## Design Tokens

### Color — brand & neutrals
| Token | Value | Use |
|---|---|---|
| `--navy-900` | `#0A1628` | sidebar, primary ink, dark cards |
| `--navy-800/700/600/500` | `#111E33 #1B2B44 #2A3C56 #3E5271` | dark surfaces |
| `--blue-600` | `#1E5BFF` | primary actions, brand accent |
| `--blue-500/400` | `#3B82F6 #5B9DFF` | focus, charts |
| `--blue-100/50` | `#DBE7FF #EEF3FF` | tints, focus halo |
| `--ink-900…50` | `#0A1628 #2A3C56 #5A6B85 #8695AE #B4BECF #D7DDE8 #EBEFF5 #F5F7FB` | text & border ramp |
| `--paper / --canvas` | `#FFFFFF / #F9FAFC` | card / page background |

### Color — semantic & sub-app accents
| Token | Value | Tint bg |
|---|---|---|
| `--success` | `#16A34A` | `#DCFCE7` |
| `--warning` | `#D97706` | `#FEF3C7` |
| `--danger` | `#C24A3E` (muted terracotta) | `#FBE8E5` |
| `--concept` (ConceptNexus) | `#7C3AED` | `#F1EAFE` |
| `--invest` (vestDen) | `#10B981` | `#E6F8F1` |
| `--collab` (CollaBoard) | `#E87D4A` | `#FCEEE4` |
| `--skills` (SkillsCanvas) | `#06B6D4` | `#E0F6FA` |

Dark theme: canvas `#0A1628`, paper `#111E33`, ink ramp inverted, accent tints become 12–18% alpha overlays (see the `[data-theme="dark"]` block in the HTML).

### Typography
| Role | Font | Notes |
|---|---|---|
| Display / titles / numbers | **Space Grotesk** 400–700 | letter-spacing −0.02 to −0.035em |
| Body / UI | **Inter** 400–700 | 13–15px body, 11px metas |
| Data / money / code | **JetBrains Mono** 400–500 | all ₦ amounts, scores, metrics |

Scale: page title 32 (24 mobile) · card title 17 · stat value 26 · body 13–14 · meta 11 · micro-labels 10–11px uppercase, letter-spacing 0.08–0.12em, weight 600.

### Spacing, radius, shadow
- Spacing: 4pt base (4/8/12/16/20/24/32/48…). Content padding 32px (18px mobile); card padding 18–24px; grid gaps 14–16px.
- Radii: `--r-sm 6 / --r-md 10 / --r-lg 14 (cards) / --r-xl 20 (modals) / --r-2xl 28 / full 999`.
- Shadows: sm `0 1px 2px rgba(10,22,40,.04)` · md `0 4px 12px .06 + 0 1px 2px .04` · lg `0 12px 32px .08 + 0 2px 6px .04`.
- Min hit target on mobile: 44px.

## Assets
- `assets/fixars-mark.png` — app mark used in sidebar/mobile header (white-friendly).
- Full logo set (lockups, wordmark, mono/white variants, app icons) in the source project's `assets/` folder; the bundle includes the ones the prototype references.
- All other icons are inline stroke SVGs (1.8–2px stroke, round caps, 20–24px viewBox) — map to Lucide/Feather equivalents in the target codebase.

## Files
| File | Contents |
|---|---|
| `Fixars Prototype v2.html` | Shell markup + complete token & component CSS (the styling source of truth) |
| `v2/data.js` | Data models + seed data (API contract reference) |
| `v2/pages.js` | All 11 screen render functions + card components |
| `v2/app.js` | Routing, command palette, notifications, live filtering, modal flows, toasts |
| `Fixars Design System.html` | Extended design-system reference (logo rules, full token sheets, component gallery) |
| `assets/` | Logo marks referenced by the prototype |

Open `Fixars Prototype v2.html` in a browser to explore every screen and interaction described above.
