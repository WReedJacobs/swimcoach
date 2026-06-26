import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/prefersReducedMotion'

/**
 * Card tilt (handoff Workstream 2c). Attach the returned ref to a card; it
 * tilts toward the cursor and lifts 6px, snapping back smoothly on leave.
 * No-op under prefers-reduced-motion. Returns a ref typed for the element.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return

    const onEnter = () => {
      el.style.transition = 'transform .12s ease-out, border-color .3s, box-shadow .4s'
    }
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      el.style.transform = `perspective(820px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-6px)`
    }
    const onLeave = () => {
      el.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1), border-color .3s, box-shadow .4s'
      el.style.transform = 'translateY(0)'
    }

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return ref
}
