/**
 * Static, animation-free background for the /welcome-v2 hero. Shown to
 * reduced-motion users and on browsers/devices without WebGL2 — a calm,
 * still-water gradient in the app's deepwater palette rather than the
 * animated caustics scene (or a broken canvas).
 *
 * Colours come straight from the Deepwater tokens via `rgb(var(--c-*))`, so
 * this themes for free in both dark and `.light` (DESIGN.md rule 2/5).
 */
export function HeroFallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background: [
          'radial-gradient(70% 55% at 50% 32%, rgb(var(--c-primary) / 0.16), transparent 72%)',
          'linear-gradient(180deg, rgb(var(--c-bg)) 0%, rgb(var(--c-primary) / 0.10) 55%, rgb(var(--c-bg)) 100%)',
        ].join(', '),
      }}
    />
  )
}
