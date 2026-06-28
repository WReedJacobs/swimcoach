# Swimphoria Design System — "Deepwater"

A cyber-minimal, **dark-first** performance identity. The entire palette is
delivered through a token layer (CSS variables + semantic Tailwind names), so
the ~30 feature pages inherit the look without per-page color code.

## Non-negotiable rules

1. **Never hardcode a color.** No hex (`#0EA5E9`), no Tailwind palette literals
   (`bg-sky-500`, `text-slate-600`). Always use a semantic token: `bg-primary`,
   `text-text-secondary`, `border-border`, `bg-surface`, etc.
2. **For non-Tailwind contexts** (SVG `stroke`/`fill`, Recharts props, inline
   `style`), reference the variable directly: `stroke="rgb(var(--c-primary))"`.
3. **Text on a `primary` (aqua) fill uses `text-on-primary`**, never
   `text-white` — aqua is too light for white to be legible. Coral fills
   (`bg-coral`) keep `text-white`.
4. **Numerals get `font-mono`** — times, paces, splits, distances, counts. This
   is the "instrument" feel; pair with `tabular-nums` for aligned digits.
5. **Both themes must work.** Dark is default; `.light` on `<html>` switches.
   Because colors are variables, correct token usage themes for free — adding a
   hardcoded color silently breaks one theme.
6. **Radii** use the named scale only: `rounded-component` (6px),
   `rounded-card` (10px), `rounded-modal` (14px).
7. **Primary actions** carry `shadow-glow` (the aqua accent glow). It's baked
   into the `Button` `primary` variant — don't re-add it ad hoc.

## Tokens (semantic name → meaning)

| Token | Tailwind | Meaning |
|---|---|---|
| `--c-primary` / `--c-primary-dark` | `primary` / `primary-dark` | Electric aqua — the single brand accent |
| `--c-on-primary` | `on-primary` | Dark ink for text/icons on aqua fills |
| `--c-secondary` | `secondary` | Success green (progress, achieved) |
| `--c-accent` | `accent` | Warning amber (PBs, highlights) |
| `--c-danger` | `danger` | Red (errors, destructive, stop) |
| `--c-coral` | `coral` | Beginner-mode accent (white text OK) |
| `--c-bg` | `bg` | Abyssal canvas (page background) |
| `--c-surface` | `surface` | Raised panel (cards, modals, sidebar) |
| `--c-border` | `border` | Hairline dividers/outlines |
| `--c-text-primary/secondary/muted` | `text-text-*` | Ink ramp |

Values live in `src/index.css` (`:root` = dark, `.light` = light). The
Tailwind mapping lives in `tailwind.config.js`.

## Type

- **Space Grotesk** — sans / UI (`font-sans`, the default).
- **JetBrains Mono** — numerals (`font-mono`). Apply to any metric.

## Where things live

- **Tokens / theme:** `src/index.css`, `tailwind.config.js`
- **Primitives (re-skin here, pages follow):** `src/components/ui/*`
- **Global chrome:** `src/components/layout/*` (AppShell, Sidebar, TopBar)
- **Brand lockup:** `src/components/BrandMark.tsx` — the glowing accent dot + "Swimphoria"
  wordmark. Use it for ALL brand placements (hero, sidebar, auth) so the identity is
  identical everywhere; beginner mode passes `tone="coral"`. Don't hand-roll a logo.

**Chrome identity:** headers are translucent + `backdrop-blur` over `bg-bg/80`; micro-labels
(roles, eyebrows, units) are `font-mono uppercase tracking-[0.14em] text-text-muted`; the active
sidebar item carries an inset accent bar (`shadow-[inset_2px_0_0_rgb(var(--c-primary))]`). Keep
new chrome consistent with this so in-app screens read the same as the marketing hero.

## Theme toggle (optional, not yet wired)

```ts
document.documentElement.classList.toggle('light')
// persist
if (localStorage.getItem('theme') === 'light')
  document.documentElement.classList.add('light')
```

## Motion system (Workstream 2)

Reusable, accessibility-gated motion hooks live in `src/hooks/`; the entrance
keyframes (`animate-fade-up`, `animate-drift`, `animate-ring-in`, `animate-fade-in`)
live in `src/index.css`. Rules:

- **Every motion hook MUST early-out on `prefersReducedMotion()`** (`src/lib/prefersReducedMotion.ts`).
  A global `@media (prefers-reduced-motion: reduce)` block also neutralizes CSS animations.
- **Never `setState` on mousemove/scroll.** Drive cursor/parallax/magnetic effects
  from a single shared `requestAnimationFrame` loop and write transforms straight to refs
  (see `useCursorFx`).
- Hooks: `useCursorFx` (halo + lead dot + grid parallax + magnetic CTA),
  `useTilt` (card tilt), `useReveal` (staggered scroll reveal, 0.07s/batch),
  `useCountUp` (ease-out cubic metric count-up).
- Easing is `cubic-bezier(.2,.7,.2,1)` throughout; the single accent is aqua (`--c-primary`).
- The marketing hero using all of this is `src/features/marketing/WelcomePage.tsx`
  at route `/welcome` (the logged-out landing).

## Hero composition patterns (use on every page)

The feature pages share the marketing hero's visual language via these pieces:
- **`SectionHeader`** (`ui/SectionHeader.tsx`) — mono uppercase kicker + hairline rule
  above each major section (`<SectionHeader kicker="OVERVIEW" />`). Wrap page roots in `space-y-8`.
- **`StatTile`** (`ui/StatTile.tsx`) — bordered "instrument" stat cell (mono label + big mono
  value + optional unit/hint; `accent` tints the value aqua). Prefer it over the icon-tile
  `StatCard` on data dashboards.
- **`Card`** now carries Deepwater depth by default; pass `interactive` for clickable cards
  (hover lift + accent border).
- **Accent hover rows** — navigational list rows use
  `hover:bg-primary/[0.07] hover:shadow-[inset_2px_0_0_rgb(var(--c-primary))]`
  (coral on beginner pages), wrapping the `<ul>` in `-mx-2`.
- **Global cursor glow** — `components/CursorFxLayer.tsx` (mounted once in `App.tsx`) renders the
  halo + lead dot on every page; reduced-motion-gated. Don't add per-page cursor layers.

## Adding a new screen — checklist

- [ ] Compose from `components/ui/*`; don't restyle primitives inline.
- [ ] Colors via semantic tokens only (rule 1–2).
- [ ] Metrics in `font-mono` (rule 4).
- [ ] Spot-check in both dark and `.light`.
