import * as THREE from 'three'

/**
 * Reads a Deepwater CSS token into a THREE.Color.
 *
 * Tokens are stored as space-separated 0-255 RGB triples (e.g.
 * `--c-primary: 54 229 200`) so Tailwind can compose
 * `rgb(var(--c-primary) / <alpha>)`. We parse that triple into a CSS
 * `rgb()` string, which THREE interprets as sRGB and converts into its
 * working colour space correctly — so the scene renders the app's real
 * aqua-on-abyssal identity, not the starter's hardcoded hex. Mirrors
 * DESIGN.md's rule for non-Tailwind contexts (`rgb(var(--c-primary))`).
 */
export function readTokenColor(name: string, fallback: string): THREE.Color {
  if (typeof window === 'undefined') return new THREE.Color(fallback)
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const parts = raw.split(/[\s,]+/).map(Number)
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    return new THREE.Color(`rgb(${parts[0]}, ${parts[1]}, ${parts[2]})`)
  }
  return new THREE.Color(raw || fallback)
}

export interface HeroPalette {
  primary: THREE.Color // electric aqua — the brand accent
  secondary: THREE.Color // success green — a second particle tint
  bg: THREE.Color // abyssal canvas — the scene background
  bright: THREE.Color // aqua->white highlight for the hottest particles
}

/**
 * Snapshot of the tokens the scene needs, read at the moment of call.
 * Re-call after the `.light` class toggles on <html> to re-theme the scene
 * (see WelcomeHeroV2's MutationObserver).
 */
export function readHeroPalette(): HeroPalette {
  // Fallbacks are the dark-theme token values, only used if the CSS var is
  // somehow unreadable (e.g. a non-DOM environment).
  const primary = readTokenColor('--c-primary', 'rgb(54, 229, 200)')
  return {
    primary,
    secondary: readTokenColor('--c-secondary', 'rgb(126, 240, 192)'),
    bg: readTokenColor('--c-bg', 'rgb(10, 15, 30)'),
    // Hottest particles ride the aqua->white range (Milestone 2's "subtle
    // aqua/white range pulled from the tokens") rather than a hardcoded white.
    bright: primary.clone().lerp(new THREE.Color(1, 1, 1), 0.72),
  }
}
