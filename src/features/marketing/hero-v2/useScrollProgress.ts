import { useEffect, useRef } from 'react'
import type { MutableRefObject } from 'react'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * 0-1 scroll progress through the full page, written to a ref by GSAP
 * ScrollTrigger. Deliberately a ref, not React state: DESIGN.md's motion
 * rule is "never setState on scroll" — the scene reads `.current` inside
 * its own requestAnimationFrame (useFrame) loop, so scrolling never
 * triggers a React re-render.
 */
export function useScrollProgressRef(): MutableRefObject<number> {
  const progress = useRef(0)

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress
      },
    })
    return () => trigger.kill()
  }, [])

  return progress
}
