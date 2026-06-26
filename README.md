# SwimCoach 🏊

A full-stack web app for **coaches**, **swimmers**, and self-guided **beginners**. Built web-first with a React Native port in mind (pure Vite SPA, framework-agnostic types and helpers, no Next.js).

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS v3 (custom palette)
- React Router v6
- Supabase (auth, Postgres, realtime)
- Zustand (global state) + TanStack Query (server state)
- React Hook Form + Zod
- Recharts, Lucide React

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL + anon key
npm run dev
```

> Beginner mode (`/beginner`) is a **public** route and works with no Supabase setup at all — guides, glossary, milestones, and self-logging are stored in `localStorage`. Coach and swimmer portals require a Supabase project.

### Environment

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase setup

1. Create a project at supabase.com.
2. Run the migration in the SQL editor: `supabase/migrations/001_initial.sql` (tables, enums, RLS policies, and a trigger that auto-creates a `profiles` row on signup).
3. To seed demo data (`supabase/seed.sql`): first create the auth users (the coach + 4 swimmers) via the dashboard/admin API, map their UUIDs to the placeholders at the top of the file, then run it. The seed gives you a coach, 4 swimmers across levels, 3 sessions (past/today/future), ~14 times, goals, and 5 built-in drills so charts render immediately.

## Roles

| Role | Home | What they get |
|------|------|---------------|
| **Coach** | `/coach` | Dashboard, roster, **time logger** (stopwatch + bulk entry, auto PB detection), session builder, progress charts, feedback, 1:1 messaging, bookings, drills |
| **Swimmer** | `/swimmer` | Today's session, own times with PB badges, progress chart, goals, coach feedback, achievements, self-logging |
| **Beginner** | `/beginner` (public) | Stroke guides ("what your coach says vs what it means"), A–Z glossary, milestone tracker, self-log, 4-week starter program, find-a-coach guidance |

## Project layout

```
src/
  components/    layout (AppShell/Sidebar/TopBar), ui primitives, charts
  features/      auth · coach · swimmer · beginner · shared
  hooks/         useAuth, useSwimmers, useSessions, useTimes, useGoals, …
  lib/           supabase, formatTime, pbDetector (pure, RN-portable)
  store/         authStore (Zustand)
  types/         shared domain types
supabase/        migrations + seed
```

## Design system

Sky-blue primary (`#0EA5E9`), emerald progress (`#10B981`), amber for PBs (`#F59E0B`). Beginner mode is tinted **coral** (`#F97316`) throughout to visually distinguish it. Inter font (weights 400/500/600). Radii: 8px components, 12px cards, 16px modals.

## Notes / next steps

- **Inviting swimmers by email** currently stores a `display_name` + `invite_email` on the swimmer row; wiring the actual account invite (Supabase admin invite + linking `profile_id`) is a follow-up.
- The production bundle is a single chunk (~1 MB) — add route-level `React.lazy` code-splitting before launch.
- Beginner self-logs live in `localStorage`; syncing them to Supabase on sign-in is stubbed in the UI copy but not yet implemented.
