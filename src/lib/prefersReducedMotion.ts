// Single source of truth for the reduced-motion check. Every motion hook
// early-outs on this so the whole system honours the OS accessibility setting.
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
