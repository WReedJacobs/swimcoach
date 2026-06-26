import { useCallback, useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/prefersReducedMotion'

/**
 * Scroll reveal (handoff Workstream 2e). Returns a `register` callback-ref to
 * spread onto each below-the-fold element: `<div ref={register}>`. Hidden
 * elements fade + rise into view once their top crosses 90% of the viewport,
 * with a 0.07s per-batch stagger.
 *
 * Uses a scroll-position check rather than IntersectionObserver (per the
 * handoff) for predictable behaviour. No-op under prefers-reduced-motion —
 * elements are shown immediately.
 */
export function useReveal() {
  const pending = useRef<HTMLElement[]>([])
  const seen = useRef<WeakSet<HTMLElement>>(new WeakSet())

  const register = useCallback((el: HTMLElement | null) => {
    if (!el || seen.current.has(el)) return
    seen.current.add(el)
    if (prefersReducedMotion()) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }
    el.style.opacity = '0'
    el.style.transform = 'translateY(24px)'
    el.style.transition =
      'opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1)'
    pending.current.push(el)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const check = () => {
      const vh = window.innerHeight
      let n = 0
      pending.current = pending.current.filter((el) => {
        const r = el.getBoundingClientRect()
        if (r.top < vh * 0.9 && r.bottom > 0) {
          el.style.transitionDelay = `${n * 0.07}s`
          el.style.opacity = '1'
          el.style.transform = 'none'
          n++
          return false
        }
        return true
      })
    }

    // Run once after first paint so initially-visible elements reveal.
    const raf = requestAnimationFrame(check)
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [])

  return register
}
