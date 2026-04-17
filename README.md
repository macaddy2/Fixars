# Fixars

The connected productivity ecosystem: **invest in ideas (VestDen)**, **validate concepts (ConceptNexus)**, **collaborate on projects (Collaboard)**, and **showcase/book talent (SkillsCanvas)** — all from a single account with shared points, notifications, and real-time activity.

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
| `npm run start` | Build and serve `dist/` (used by Railway) |
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

## Deployment

Configured for Railway via `railway.json`; the `start` script builds and serves the static `dist/` folder on `$PORT`.

## Contributing

1. Branch from `main`
2. Run `npm run lint` before pushing
3. Open a PR; keep commits focused and descriptive
