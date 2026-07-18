import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { prefersReducedMotion } from '@/lib/prefersReducedMotion'
import { useAuth } from '@/hooks/useAuth'
import HeroScene from './HeroScene'
import { HeroFallback } from './HeroFallback'
import { WelcomeContent } from './WelcomeContent'
import { useScrollProgressRef } from './useScrollProgress'
import { readHeroPalette } from './tokenColors'

interface Caps {
  reducedMotion: boolean
  webgl2: boolean
  mobile: boolean
}

function detectWebGL2(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
}

/** One-time capability probe. Reduced motion and missing WebGL2 both fall
 * back to a static frame; mobile trims particle count / passes / DPR. */
function detectCaps(): Caps {
  const mobile =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches
  return { reducedMotion: prefersReducedMotion(), webgl2: detectWebGL2(), mobile }
}

export function WelcomeHeroV2() {
  const navigate = useNavigate()
  const { isAuthenticated, profile } = useAuth()
  const [caps] = useState(() => detectCaps())
  const [palette, setPalette] = useState(() => readHeroPalette())
  const scrollRef = useScrollProgressRef()

  // Primary landing: send already-signed-in visitors on to their portal
  // instead of showing them the marketing hero (mirrors the classic hero).
  const dashboardPath = isAuthenticated && profile?.role ? `/${profile.role}` : null
  useEffect(() => {
    if (dashboardPath) navigate(dashboardPath, { replace: true })
  }, [dashboardPath, navigate])

  // Re-read tokens when the `.light` class is toggled on <html> while this
  // route is mounted, so the scene re-themes with the rest of the app.
  useEffect(() => {
    const obs = new MutationObserver(() => setPalette(readHeroPalette()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const animated = !caps.reducedMotion && caps.webgl2

  return (
    <div className="relative min-h-screen overflow-x-hidden text-text-primary">
      {/* Fixed background layer: animated WebGL particle scene, or a static
          frame for reduced-motion / non-WebGL2 visitors. The page content
          scrolls over it (which also drives the scene's scroll reactivity). */}
      <div className="fixed inset-0 z-0">
        {animated ? (
          <HeroScene
            palette={palette}
            scrollRef={scrollRef}
            heavyFx={!caps.mobile}
            dprMax={caps.mobile ? 1.5 : 2}
          />
        ) : (
          <HeroFallback />
        )}
      </div>

      {/* Scrim: knocks the bright field back so the content reads cleanly,
          while the particles still glow through and around the panels. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'linear-gradient(180deg, rgb(var(--c-bg) / 0.22) 0%, rgb(var(--c-bg) / 0.1) 26%, rgb(var(--c-bg) / 0.1) 70%, rgb(var(--c-bg) / 0.3) 100%)',
        }}
      />

      {/* The real /welcome layout + copy, floated on panels in front. */}
      <div className="relative z-10">
        <WelcomeContent />
      </div>
    </div>
  )
}
