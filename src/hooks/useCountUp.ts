import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/prefersReducedMotion'

/**
 * Count-up metric (handoff Workstream 2f). Attach the returned ref to a
 * <span>; its text animates from 0 to `target` over `durationMs` with an
 * ease-out cubic, comma-formatted. Writes textContent directly (no per-frame
 * React state). Under prefers-reduced-motion it jumps straight to the target.
 */
export function useCountUp(target: number, durationMs = 1400) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fmt = (n: number) => Math.round(n).toLocaleString('en-US')

    if (prefersReducedMotion()) {
      el.textContent = fmt(target)
      return
    }

    let raf = 0
    const t0 = performance.now()
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      if (ref.current) ref.current.textContent = fmt(target * ease(p))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return ref
}
