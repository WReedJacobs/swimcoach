# Swimphoria

A full-stack web app for coaches, swimmers, and self-guided beginners.
React 18 + TypeScript + Vite · Tailwind v3 · Supabase · Zustand + TanStack Query.
Built web-first but RN-portable (framework-agnostic `lib/` and `types/`).

## Design — READ BEFORE ANY UI WORK

This project uses the **"Deepwater"** design system: a dark-first, token-driven
theme. The full spec and rules are in **[DESIGN.md](DESIGN.md)** — follow it for
every visual change. The load-bearing rules:

- **Never hardcode colors.** Use semantic tokens (`bg-primary`, `text-text-secondary`,
  `border-border`, `bg-surface`). In SVG/Recharts/inline styles use
  `rgb(var(--c-primary))`. No hex, no `bg-sky-500`-style literals.
- **Text on aqua `primary` fills = `text-on-primary`**, not `text-white`.
- **Numerals use `font-mono`** (times, paces, distances, counts).
- **Both dark and `.light` themes must work** — correct token usage guarantees this.
- Re-skin via `src/components/ui/*` primitives; the ~30 feature pages inherit.

## Conventions

- `lib/` holds pure, framework-agnostic logic (e.g. `pbDetector`, `formatTime`,
  `cssCalculator`) — keep it DOM-free and unit-tested (`npm test`, vitest).
- Pages live under `src/features/<role>/`; routes in `src/App.tsx`; nav in
  `src/components/layout/nav.ts`.
- Beginner mode (`/beginner/*`) is public and persists to `localStorage`.

## Commands

- `npm run dev` — Vite dev server
- `npm test` — vitest
- `npm run build` — typecheck + production build
