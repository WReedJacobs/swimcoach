import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/prefersReducedMotion'

/**
 * Deepwater cursor motion (handoff Workstream 2a/2b/2d), all driven by a
 * SINGLE shared requestAnimationFrame loop — never setState on mousemove.
 * Transforms are written straight to the refs.
 *
 * Returns refs to attach:
 *  - haloRef:     the 540px blurred aqua halo (lags far behind, lerp 0.075)
 *  - dotRef:      the 7px lead dot (tracks closely, lerp 0.22)
 *  - gridRef:     the background grid layer (parallax, opposite the cursor)
 *  - magneticRef: a CTA that pulls toward the cursor within 150px
 *
 * The whole loop is skipped under prefers-reduced-motion.
 */
export function useCursorFx() {
  const haloRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const magneticRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    let tx = window.innerWidth * 0.5
    let ty = window.innerHeight * 0.4
    let hx = tx
    let hy = ty
    let dx = tx
    let dy = ty
    let hot = 0
    let hotCur = 0
    let raf = 0

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }
    // Delegated hover detection — the halo swells over interactive targets.
    const onOver = (e: MouseEvent) => {
      const t = e.target as Element | null
      hot = t?.closest?.('button, a, [data-tilt]') ? 1 : 0
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver, { passive: true })

    const loop = () => {
      hx += (tx - hx) * 0.075
      hy += (ty - hy) * 0.075
      dx += (tx - dx) * 0.22
      dy += (ty - dy) * 0.22
      hotCur += (hot - hotCur) * 0.12

      const hs = 1 + hotCur * 0.42
      const ds = 1 + hotCur * 1.4

      if (haloRef.current) {
        haloRef.current.style.transform = `translate3d(${hx}px, ${hy}px, 0) scale(${hs})`
        haloRef.current.style.opacity = String(0.9 + hotCur * 0.35)
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(${ds})`
        dotRef.current.style.opacity = String(0.85 - hotCur * 0.45)
      }
      if (gridRef.current) {
        const ox = (tx - window.innerWidth / 2) / window.innerWidth
        const oy = (ty - window.innerHeight / 2) / window.innerHeight
        gridRef.current.style.transform = `translate3d(${ox * -26}px, ${oy * -26}px, 0)`
      }
      const cta = magneticRef.current
      if (cta) {
        const r = cta.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        const dist = Math.hypot(tx - cx, ty - cy)
        const R = 150
        if (dist < R) {
          const k = (1 - dist / R) * 0.32
          cta.style.transform = `translate(${(tx - cx) * k}px, ${(ty - cy) * k}px)`
        } else {
          cta.style.transform = 'translate(0, 0)'
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
    }
  }, [])

  return { haloRef, dotRef, gridRef, magneticRef }
}
