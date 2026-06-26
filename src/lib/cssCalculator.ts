// Critical Swim Speed (CSS) maths. Pure, framework-agnostic, RN-safe —
// no DOM or data-layer deps, mirroring lib/pbDetector and lib/formatTime.
//
// CSS is the pace a swimmer can theoretically hold without exhausting,
// estimated from a 400m and a 200m time trial. It is the anchor most
// serious training apps (MySwimPro, SwimUp) build their sets around:
//   CSS speed = (D₂ − D₁) / (T₂ − T₁)   with D₂ = 400m, D₁ = 200m
// Expressed as a pace per 100m it drives every set's target and send-off.

/** Standard CSS time-trial distances, in metres. */
export const CSS_LONG = 400
export const CSS_SHORT = 200

export interface CssResult {
  /** Sustainable speed in metres per second. */
  speedMps: number
  /** CSS pace expressed as seconds per 100m — the value sets are built on. */
  pacePer100: number
}

/**
 * Compute CSS from a 400m and a 200m time-trial (both in seconds).
 * Returns null if the inputs are non-finite, non-positive, or physically
 * impossible (the 400 must be slower than the 200 but less than twice it).
 */
export function calculateCss(t400: number, t200: number): CssResult | null {
  if (![t400, t200].every((t) => Number.isFinite(t) && t > 0)) return null
  // The 400 must take longer than the 200, else speed is zero/negative.
  if (t400 <= t200) return null
  const speedMps = (CSS_LONG - CSS_SHORT) / (t400 - t200)
  if (!Number.isFinite(speedMps) || speedMps <= 0) return null
  return { speedMps, pacePer100: 100 / speedMps }
}

/**
 * Training pace zones as offsets (seconds per 100m) relative to CSS pace.
 * Positive = slower than CSS, negative = faster. These are the conventional
 * bands coaches cue: recovery and aerobic work sit above CSS, threshold is
 * CSS itself, VO₂/race and sprint sit below it.
 */
export interface PaceZone {
  key: 'recovery' | 'aerobic' | 'threshold' | 'race' | 'sprint'
  label: string
  offsetPer100: number
}

export const PACE_ZONES: PaceZone[] = [
  { key: 'recovery', label: 'Recovery', offsetPer100: 12 },
  { key: 'aerobic', label: 'Aerobic / endurance', offsetPer100: 6 },
  { key: 'threshold', label: 'Threshold (CSS)', offsetPer100: 0 },
  { key: 'race', label: 'Race pace', offsetPer100: -3 },
  { key: 'sprint', label: 'Sprint', offsetPer100: -6 },
]

/**
 * Target time (seconds) to swim `distance` metres at CSS pace, optionally
 * shifted by an offset in seconds-per-100m (e.g. +5 for "CSS+5", a touch
 * easier than threshold). Returns null for non-positive distance.
 */
export function paceForDistance(
  pacePer100: number,
  distance: number,
  offsetPer100 = 0,
): number | null {
  if (!Number.isFinite(distance) || distance <= 0) return null
  const effective = pacePer100 + offsetPer100
  if (effective <= 0) return null
  return (effective * distance) / 100
}

/**
 * A repeat-set target: the swim time for each rep plus a suggested send-off
 * (the clock interval you leave on), built from a desired rest in seconds.
 * The send-off is rounded UP to the next 5-second mark, the way pace clocks
 * are read on the pool wall.
 */
export interface SetTarget {
  reps: number
  distance: number
  /** Target time per rep, in seconds. */
  repSeconds: number
  /** Suggested send-off interval per rep, in seconds. */
  sendOffSeconds: number
}

/** Round a duration up to the next whole `step` seconds (default 5s). */
export function roundUpToInterval(seconds: number, step = 5): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0
  return Math.ceil(seconds / step) * step
}

/**
 * Build a paced repeat set, e.g. 8 × 100m at CSS+5 with ~15s rest.
 * Returns null if the rep pace can't be computed or reps < 1.
 */
export function buildSetTarget(
  pacePer100: number,
  reps: number,
  distance: number,
  offsetPer100 = 0,
  restSeconds = 15,
): SetTarget | null {
  if (!Number.isInteger(reps) || reps < 1) return null
  const repSeconds = paceForDistance(pacePer100, distance, offsetPer100)
  if (repSeconds == null) return null
  const rest = Number.isFinite(restSeconds) && restSeconds > 0 ? restSeconds : 0
  return {
    reps,
    distance,
    repSeconds,
    sendOffSeconds: roundUpToInterval(repSeconds + rest),
  }
}
