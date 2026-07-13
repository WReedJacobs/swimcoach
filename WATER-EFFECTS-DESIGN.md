# Watery hover/click effects — implementation spec

Design direction confirmed after 4 rounds of HTML prototyping (not in this
repo — standalone preview files). This doc is the build spec. Read
`DESIGN.md` in full before starting, especially the "Motion system"
section — every effect below must follow its rules (`prefersReducedMotion`
early-out, no `setState` on mousemove/scroll, write transforms straight to
refs, `cubic-bezier(.2,.7,.2,1)`-family easing, single aqua accent).

All four effects below ship together — this is not a pick-one. See "Where
each effect goes" at the end for the intended split.

---

## 1. Layered ocean background (replaces flat `bg-bg`)

Currently `AppShell.tsx` (~line 37) renders `<div className="flex h-screen ... bg-bg">` as the outer container — a flat fill. Replace with a 3-layer effect:

- **Layer 1 — abyssal gradient.** Two soft radial tints (aqua top-left,
  secondary-green bottom-right) over a vertical linear gradient from
  `--c-bg` to `--c-surface`. Static, no animation.
- **Layer 2 — drifting caustic blobs.** 3 large, heavily blurred
  (`blur(70px)`) radial circles tinted primary/secondary/coral at low
  opacity, each on its own slow (22–30s) `ease-in-out` drift loop
  (translate + scale, ±5%). This is ambient — keep it barely-there, not a
  lava lamp.
- **Layer 3 — fine texture + vignette + ambient ripples.** An SVG
  `feTurbulence` fractal-noise filter at ~5% opacity (`mix-blend-mode:
  screen` in dark, `multiply` in light) for a subtle caustic-ripple
  texture, plus a radial vignette darkening the edges, plus the ambient
  ripple spawner described in section 2.

**New file:** `src/components/OceanBackground.tsx` — a single component
mounted once in `AppShell.tsx` (same pattern as `CursorFxLayer` in
`App.tsx`), `position: fixed; inset: 0; z-index: 0; pointer-events: none`,
rendering all 3 layers. Add the drift keyframes to `src/index.css` next to
the existing `@keyframes drift` (reuse/extend that one where possible
instead of adding near-duplicates). Gate the blob drift animation and the
turbulence `<animate>` under `prefers-reduced-motion` same as the existing
`@media (prefers-reduced-motion: reduce)` block already does globally —
verify the turbulence `<animate>` element actually respects that (SMIL
animations aren't covered by the CSS media block, so `OceanBackground`
needs to check `prefersReducedMotion()` itself and omit the `<animate>`
child / render a static noise frame instead).

Tokens only: `rgb(var(--c-primary) / 0.1)` etc., never hex — same rule as
everywhere else in the app.

## 2. Ambient pool ripples (part of the background, not a card effect)

Every ~1.9s, spawn a pair of staggered concentric ring elements at a random
point within `OceanBackground`, each expanding via `scale(0)` →
`scale(1)` with fading opacity/border over ~5s, then removed from the DOM.
Two rings per "drop" (the second delayed ~0.5s, fainter) gives the classic
water-ring look rather than a single flat circle.

Implement as an interval inside `OceanBackground` (`setInterval` in a
`useEffect`, cleared on unmount and skipped entirely under
`prefersReducedMotion()`), appending/removing plain `div`s — no need for
React state per-ripple, this is a pure DOM-node lifecycle like the existing
`useCursorFx` pattern of writing outside React's render loop.

## 3. Card hover — spotlight glass

Confirmed direction, applies to every `interactive` `Card`. On top of the
card's existing hover lift/border (`Card.tsx` ~line 18-19), add:

- `background: rgb(var(--c-surface) / 0.6)` + `backdrop-filter: blur(14px)`
  when `interactive` (frosted glass instead of solid surface).
- A `::before` layer: `radial-gradient(220px circle at var(--mx,50%)
  var(--my,50%), rgb(var(--c-primary) / 0.16), transparent 70%)`, opacity 0
  by default, opacity 1 on `:hover`.
- `--mx`/`--my` are set on `mousemove`, written directly via
  `el.style.setProperty()` — **not** `setState`, per the Motion system rule.
  Since this only needs to run while hovering one card (not a global
  per-frame loop like `useCursorFx`), a plain `onMouseMove` handler calling
  `style.setProperty` directly is fine and doesn't need a shared rAF loop —
  it's not driving continuous animation, just repositioning a CSS variable
  on discrete mouse-move events.

**Where to add it:** extend `Card.tsx`'s `interactive` branch (~line 18) —
don't create a second component. Keep the existing
`hover:-translate-y-0.5 hover:border-primary/45` classes, they're already
correct; this only adds the frosted background + spotlight `::before`.

No `prefersReducedMotion` gate needed here — it's a hover state driven by
existing `:hover`/transition CSS, not a running animation loop.

## 4. Click effects — three variants, used contextually

All three are one-shot: on click, append transient DOM node(s) positioned
at the click coordinates (relative to the card, via
`getBoundingClientRect()`), let the CSS animation play, then remove the
node(s) via `setTimeout` matching the animation duration. This matches how
`GuideFooter`'s sentinel/observer pattern and `useCursorFx` already avoid
routing high-frequency updates through React state — same principle
applies to spawn-and-forget effect nodes.

**New file:** `src/hooks/useWaterClick.ts` exporting three functions
(or one hook with a `variant` param — implementer's call):
`splash(el, event)`, `multiRipple(el, event)`, `shoreWave(el, event)`. Each
takes the clicked element and the mouse event, does the
`getBoundingClientRect()` math, and appends/cleans-up the effect nodes.
Consuming components call e.g. `onClick={(e) => splash(e.currentTarget, e)}`.

All three should no-op (skip the animation, just let the click's real
action happen) under `prefersReducedMotion()` — they're decorative, not
functional, so the correct reduced-motion behavior is "nothing extra
happens," not "instant version of the effect."

### 4a. Splash — droplets + 2 rings
Two staggered expanding rings (0.7s, second delayed 0.12s, fainter) plus 7
small droplet dots that scatter upward-and-outward from the click point
then fall and fade (~0.65s each, randomized angle/distance per droplet via
inline `--px/--py/--fx/--fy` custom properties consumed by one shared
`@keyframes splashDroplet`). Reads as playful/organic.

### 4b. Multi-ripple — 5 concentric rings
Five rings, all centered on the exact click point, staggered ~0.11s apart,
sizes scaling up (`maxDim * (0.45 + i * 0.38)`), each fading independently
(~1.1–1.3s total). This is the same visual family as the ambient
background ripples (section 2) and the general-purpose default click
effect.

### 4c. Shoreline wave — foam wash, in and back out
Slower (~2.6s) and reserved for rare, celebratory confirmations — not
everyday clicks. An SVG shape with a scalloped/wavy top edge (foam line)
fills from the bottom of the card upward to ~80% coverage, holds briefly,
then recedes back down and off — i.e. `translateY(100%) → translateY(16%)
→ translateY(20%) hold → translateY(100%)`, not a straight left-to-right
sweep. Fill is a vertical gradient (bright primary near the foam edge,
fading to transparent secondary at the bottom), plus a separate
stroke-only path tracing just the top scalloped curve for a brighter
"crest" line.

## Where each effect goes

- **Spotlight hover (3)** — every `interactive` `Card` across the app,
  no exceptions. This is the new baseline, replacing the current flat
  hover.
- **Multi-ripple (4b)** — default click feedback for ordinary actions
  (buttons inside cards, list rows, etc.) where you just want "the app
  acknowledged the click."
- **Splash (4a)** — beginner-mode logging/goal actions specifically
  (`SelfLogPage` save, `MilestonesPage` toggles, `FitnessProgramPage`
  session-complete toggle) — matches the exploratory, coral-adjacent tone
  of beginner mode.
- **Shoreline wave (4c)** — reserved for genuine milestones only:
  completing a `JourneyPage` stage, the `GraduationModal` "Become a
  Swimmer" confirmation, finishing the 8-week programme in
  `FitnessProgramPage`. If it shows up on every button it stops feeling
  special — keep it rare on purpose.

## Verification

- Spot-check every new visual in both dark and `.light` (toggle via the
  existing theme class on `<html>`) — no hardcoded colors, tokens only.
- Confirm `prefersReducedMotion()` actually suppresses: the blob drift, the
  turbulence `<animate>`, the ambient ripple interval, and all three click
  effects (should no-op, not "flash once").
- Confirm no `setState` calls happen inside any `mousemove`/`scroll`
  handler introduced here.
- Run `npm run build` (typecheck) and `npm test` after wiring everything in.
