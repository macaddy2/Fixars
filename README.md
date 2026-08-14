# Fixars

The connected productivity ecosystem: **invest in ideas (VestDen)**, **validate concepts (ConceptsNexus)**, **collaborate on projects (CollaBoard)**, and **showcase/book talent (SkillsCanvas)** — all from a single account with shared points, notifications, and real-time activity.

Underneath the apps sits the **Fixars Context Layer (FCL)** — the ontology/application layer where the durable value lives: models commoditise, your context compounds. See [`docs/fcl-spec.md`](docs/fcl-spec.md) (the layer's specification) and [`docs/strategy-sovereignty.md`](docs/strategy-sovereignty.md) (the positioning).

## Tech stack

- **React 19** + **Vite 7** (JSX, path alias `@/` → `src/`)
- **Tailwind CSS 4** (via `@tailwindcss/vite`)
- **Radix UI** primitives + custom components in `src/components/ui`
- **React Router 7**
- **Supabase** (auth, Postgres, realtime) — schema in `supabase/schema.sql`
- **Gemini** (optional AI recommendations, `src/lib/ai.js`)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

The app runs without Supabase configured — it falls back to local mock data, but auth, realtime, and persistence are disabled.

## Scripts

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Start Vite dev server with HMR            |
| `npm run build` | Production build to `dist/`               |
| `npm run start` | Serve `dist/` (and `/api` when `REAL_SESSION=1`) |
| `npm run server`| Same as start; use `PORT=8787` for Vite proxy |
| `npm test`      | Session, wallet, and port-adapter tests |
| `npm run lint`  | ESLint (flat config, `eslint.config.js`)  |

## Project layout

```
src/
  apps/           # Feature apps: VestDen, ConceptNexus, Collaboard, SkillsCanvas
  components/     # Shared UI (Header, Footer, NotificationDropdown, charts, ui/*)
  contexts/       # AuthContext, DataContext, PointsContext, SocialContext, SearchContext
  hooks/          # useTalents, useSkills, useReviews
  lib/
    supabase.js   # Supabase client + isSupabaseConfigured()
    db/           # Per-table data access (ideas, stakes, boards, talents, bookings, points, social)
    ai.js         # Gemini recommendations + heuristic fallback
    realtime.js   # subscribeToTable helper
    payments.js   # Payment history + formatting
  pages/          # Route pages (Home, Dashboard, Login, Signup, Feed, Profile, ...)
supabase/
  schema.sql      # Full DB schema + RLS policies
```

## Environment

See `.env.example`. Never commit a real `.env` — all `.env*` files are gitignored.

The public GitHub Pages build must leave `VITE_REAL_SESSION` unset so the
static demo path stays dummy. Railway / internal preview may set
`VITE_REAL_SESSION=1` (build) and `REAL_SESSION=1` plus `SESSION_SECRET`
(runtime) to turn on the server-issued session stack. That stack still
uses mock adapters only — no live Paystack, NIMC, or bank rails.
`isSupabaseConfigured()` stays `false`.

## Deployment

Configured for Railway via `railway.json`; the `start` script builds and serves the static `dist/` folder on `$PORT`.

### Early-access landing page

The currently deployed public waitlist is maintained as a separate project in
[`landing-page/`](landing-page/). Keeping it isolated allows the waitlist to be
deployed without publishing or changing the broader Fixars application.

### Independent product sites

The four standalone product-site implementations and their independently built
artifacts live in [`subapps/`](subapps/). Their canonical domains, Fixars
connector redirects, event boundaries, and cPanel deployment roots are recorded
in [`docs/architecture/network-event-architecture.md`](docs/architecture/network-event-architecture.md).

## Contributing

1. Branch from `main`
2. Run `npm run lint` before pushing
3. Open a PR; keep commits focused and descriptive
