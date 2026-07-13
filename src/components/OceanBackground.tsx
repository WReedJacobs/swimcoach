import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/lib/prefersReducedMotion'

const v = (name: string, alpha?: number) =>
  alpha == null ? `rgb(var(${name}))` : `rgb(var(${name}) / ${alpha})`

interface Blob {
  top: string
  left: string
  size: number
  color: string
  duration: number
  delay: number
}

const BLOBS: Blob[] = [
  { top: '-10%', left: '-5%', size: 620, color: v('--c-primary', 0.12), duration: 26, delay: 0 },
  { top: '55%', left: '70%', size: 560, color: v('--c-secondary', 0.1), duration: 30, delay: -8 },
  { top: '75%', left: '5%', size: 500, color: v('--c-coral', 0.07), duration: 22, delay: -14 },
]

/** Spawns one water-drop (2 staggered rings) at a random point. */
function spawnAmbientDrop(container: HTMLElement) {
  const x = Math.random() * container.clientWidth
  const y = Math.random() * container.clientHeight
  const make = (size: number, opacity: number, delay: number) => {
    const ring = document.createElement('div')
    ring.style.cssText = `
      position:absolute; left:${x}px; top:${y}px; width:${size}px; height:${size}px;
      margin:${-size / 2}px 0 0 ${-size / 2}px; border-radius:50%;
      border:1px solid ${v('--c-primary', opacity)}; --ripple-opacity:${opacity};
      animation: waterRipple 5s cubic-bezier(.2,.7,.2,1) ${delay}s both;
    `
    container.appendChild(ring)
    setTimeout(() => ring.remove(), (5 + delay) * 1000 + 100)
  }
  make(140, 0.35, 0)
  make(120, 0.2, 0.5)
}

/**
 * App-wide layered ocean background (WATER-EFFECTS-DESIGN.md section 1-2):
 * static abyssal gradient, slow-drifting blurred blobs, a faint caustic
 * noise texture + vignette, and an ambient ripple spawner. Mounted once in
 * AppShell, same pattern as CursorFxLayer in App.tsx — fixed, z-0,
 * pointer-events:none, so it never intercepts clicks.
 */
export function OceanBackground() {
  const rippleLayerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = rippleLayerRef.current
    if (!el) return
    const interval = window.setInterval(() => spawnAmbientDrop(el), 1900)
    return () => window.clearInterval(interval)
  }, [])

  const reduced = prefersReducedMotion()

  return (
    // z-index -1, not 0: AppShell's Sidebar/TopBar/main are plain non-positioned
    // flex children, which paint *above* a position:fixed z-index:0 sibling per
    // CSS stacking order (non-positioned in-flow content paints before z-index:0
    // positioned descendants). Negative z-index falls into the painting step
    // before that, so this reliably sits behind everything without needing to
    // touch the z-index of every other AppShell child.
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      {/* Layer 1 — abyssal gradient, static */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: [
            `radial-gradient(ellipse 60% 50% at 0% 0%, ${v('--c-primary', 0.08)}, transparent 60%)`,
            `radial-gradient(ellipse 60% 50% at 100% 100%, ${v('--c-secondary', 0.07)}, transparent 60%)`,
            `linear-gradient(180deg, ${v('--c-bg')}, ${v('--c-surface')})`,
          ].join(', '),
        }}
      />

      {/* Layer 2 — drifting caustic blobs */}
      <div style={{ position: 'absolute', inset: 0, filter: 'blur(70px)' }}>
        {BLOBS.map((b, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: b.color,
              animation: reduced ? undefined : `oceanBlobDrift ${b.duration}s ease-in-out ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Layer 3 — fine caustic texture + vignette + ambient ripples */}
      <svg className="ocean-noise" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.05 }}>
        <filter id="oceanNoise">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} stitchTiles="stitch">
            {!reduced && (
              <animate attributeName="baseFrequency" values="0.9;0.95;0.9" dur="20s" repeatCount="indefinite" />
            )}
          </feTurbulence>
        </filter>
        <rect width="100%" height="100%" filter="url(#oceanNoise)" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 45%, ${v('--c-bg', 0.6)} 100%)`,
        }}
      />
      <div ref={rippleLayerRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
