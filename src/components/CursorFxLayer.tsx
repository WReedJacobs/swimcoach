import { useCursorFx } from '@/hooks/useCursorFx'

const v = (name: string, alpha?: number) =>
  alpha == null ? `rgb(var(${name}))` : `rgb(var(${name}) / ${alpha})`

/**
 * App-wide cursor motion: the blurred aqua halo + lead dot follow the cursor
 * on EVERY page (mounted once at the app root). The halo uses `screen` blend
 * so it glows over the dark canvas without obscuring content; the dot rides
 * on top. Both are pointer-events:none and self-disable under
 * prefers-reduced-motion (handled inside useCursorFx).
 */
export function CursorFxLayer() {
  const { haloRef, dotRef } = useCursorFx()
  return (
    <>
      <div
        ref={haloRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 540,
          height: 540,
          margin: '-270px 0 0 -270px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${v('--c-primary', 0.18)} 0%, transparent 62%)`,
          filter: 'blur(40px)',
          pointerEvents: 'none',
          zIndex: 9998,
          mixBlendMode: 'screen',
          willChange: 'transform',
        }}
      />
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 7,
          height: 7,
          margin: '-3.5px 0 0 -3.5px',
          borderRadius: '50%',
          background: v('--c-primary'),
          boxShadow: `0 0 14px ${v('--c-primary')}`,
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0.85,
          willChange: 'transform',
        }}
      />
    </>
  )
}
