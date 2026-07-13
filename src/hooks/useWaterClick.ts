import { prefersReducedMotion } from '@/lib/prefersReducedMotion'

interface ClickPoint {
  clientX: number
  clientY: number
}

/** Click coordinates relative to el's own box, plus el's own size. */
function relativePoint(el: HTMLElement, event: ClickPoint) {
  const r = el.getBoundingClientRect()
  return { x: event.clientX - r.left, y: event.clientY - r.top, w: r.width, h: r.height }
}

/** These effects append absolutely-positioned children, so el needs to be a
 * positioning + clipping context. Only touches the properties that matter,
 * doesn't fight any layout-affecting styles already on el. */
function ensureContainingBlock(el: HTMLElement) {
  const cs = getComputedStyle(el)
  if (cs.position === 'static') el.style.position = 'relative'
  if (cs.overflow === 'visible') el.style.overflow = 'hidden'
}

function spawnRing(
  el: HTMLElement,
  x: number,
  y: number,
  size: number,
  { delay = 0, duration = 1.1, opacity = 0.9 }: { delay?: number; duration?: number; opacity?: number },
) {
  const ring = document.createElement('span')
  ring.style.cssText = `
    position:absolute; left:${x}px; top:${y}px; width:${size}px; height:${size}px;
    margin:${-size / 2}px 0 0 ${-size / 2}px; border-radius:50%;
    border:1.5px solid rgb(var(--c-primary) / 0.55); pointer-events:none;
    --ripple-opacity:${opacity};
    animation: waterRipple ${duration}s cubic-bezier(.2,.7,.2,1) ${delay}s both;
  `
  el.appendChild(ring)
  setTimeout(() => ring.remove(), (duration + delay) * 1000 + 100)
}

/**
 * Default click feedback for ordinary actions — 5 concentric rings centered
 * on the click point, staggered ~0.11s apart. Same visual family as
 * OceanBackground's ambient ripples.
 */
export function multiRipple(el: HTMLElement, event: ClickPoint): void {
  if (prefersReducedMotion()) return
  ensureContainingBlock(el)
  const { x, y, w, h } = relativePoint(el, event)
  const maxDim = Math.max(w, h)
  const RINGS = 5
  for (let i = 0; i < RINGS; i++) {
    spawnRing(el, x, y, maxDim * (0.45 + i * 0.38), {
      delay: i * 0.11,
      duration: 1.1 + i * 0.05,
      opacity: 0.85 - i * 0.08,
    })
  }
}

/**
 * Beginner-mode logging/goal actions — 2 staggered rings + 7 droplets that
 * scatter upward-and-outward then fall and fade. Playful/organic, matches
 * beginner mode's exploratory tone.
 */
export function splash(el: HTMLElement, event: ClickPoint): void {
  if (prefersReducedMotion()) return
  ensureContainingBlock(el)
  const { x, y, w, h } = relativePoint(el, event)
  const maxDim = Math.max(w, h)

  spawnRing(el, x, y, maxDim * 0.5, { duration: 0.7, opacity: 0.85 })
  spawnRing(el, x, y, maxDim * 0.7, { delay: 0.12, duration: 0.7, opacity: 0.5 })

  const DROPLETS = 7
  for (let i = 0; i < DROPLETS; i++) {
    // Scatter mostly upward (-90°) with spread, then fall further down.
    const angle = (-90 + (Math.random() - 0.5) * 140) * (Math.PI / 180)
    const scatterDist = 14 + Math.random() * 16
    const px = Math.cos(angle) * scatterDist
    const py = Math.sin(angle) * scatterDist
    const fx = px + (Math.random() - 0.5) * 10
    const fy = py + 24 + Math.random() * 16

    const drop = document.createElement('span')
    const size = 3 + Math.random() * 3
    drop.style.cssText = `
      position:absolute; left:${x}px; top:${y}px; width:${size}px; height:${size}px;
      margin:${-size / 2}px 0 0 ${-size / 2}px; border-radius:50%;
      background:rgb(var(--c-primary) / 0.8); pointer-events:none;
      --px:${px}px; --py:${py}px; --fx:${fx}px; --fy:${fy}px;
      animation: splashDroplet 0.65s cubic-bezier(.2,.7,.2,1) ${Math.random() * 0.08}s both;
    `
    el.appendChild(drop)
    setTimeout(() => drop.remove(), 850)
  }
}

/**
 * Rare, celebratory confirmations only — a scalloped foam line washes up
 * from the bottom of el, holds, recedes. No click-point math needed (it's
 * a full-width wash, not point-based); `event` is accepted for signature
 * parity with the other two variants so call sites can swap freely.
 */
export function shoreWave(el: HTMLElement, _event?: ClickPoint): void {
  if (prefersReducedMotion()) return
  ensureContainingBlock(el)

  const wrap = document.createElement('div')
  wrap.style.cssText = `
    position:absolute; inset:0; overflow:hidden; pointer-events:none;
    border-radius:inherit;
  `
  const wave = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  wave.setAttribute('viewBox', '0 0 200 100')
  wave.setAttribute('preserveAspectRatio', 'none')
  wave.style.cssText = `
    position:absolute; left:0; right:0; bottom:-2%; width:100%; height:70%;
    animation: shorelineWave 2.6s cubic-bezier(.2,.7,.2,1) both;
  `
  const d =
    'M0,30 Q10,10 20,30 T40,30 T60,30 T80,30 T100,30 T120,30 T140,30 T160,30 T180,30 T200,30 L200,100 L0,100 Z'
  wave.innerHTML = `
    <defs>
      <linearGradient id="shoreFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="rgb(var(--c-primary) / 0.55)" />
        <stop offset="100%" stop-color="rgb(var(--c-secondary) / 0.15)" />
      </linearGradient>
    </defs>
    <path d="${d}" fill="url(#shoreFill)" />
    <path d="M0,30 Q10,10 20,30 T40,30 T60,30 T80,30 T100,30 T120,30 T140,30 T160,30 T180,30 T200,30"
      fill="none" stroke="rgb(var(--c-primary) / 0.8)" stroke-width="1.5" />
  `
  wrap.appendChild(wave)
  el.appendChild(wrap)
  setTimeout(() => wrap.remove(), 2700)
}
