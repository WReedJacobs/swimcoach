import type { SwimTime, Stroke } from '@/types'

/**
 * Determine whether a candidate time is a personal best for a given
 * swimmer + stroke + distance, compared against existing times.
 *
 * A PB is a *lower* time_seconds than every prior time for the same
 * stroke and distance. The very first time logged for a combination
 * is always a PB.
 *
 * Pure function — pass in the existing times so it stays testable and
 * has no data-layer dependency.
 */
export function isPersonalBest(
  candidateSeconds: number,
  stroke: Stroke,
  distance: number,
  existingTimes: SwimTime[],
): boolean {
  const comparable = existingTimes.filter(
    (t) => t.stroke === stroke && t.distance === distance,
  )
  if (comparable.length === 0) return true
  const fastest = Math.min(...comparable.map((t) => t.time_seconds))
  return candidateSeconds < fastest
}

/**
 * Returns the fastest (PB) time per stroke+distance from a list.
 * Useful for progress views and dashboards.
 */
export function fastestByEvent(times: SwimTime[]): Map<string, SwimTime> {
  const map = new Map<string, SwimTime>()
  for (const t of times) {
    const key = `${t.stroke}-${t.distance}`
    const current = map.get(key)
    if (!current || t.time_seconds < current.time_seconds) {
      map.set(key, t)
    }
  }
  return map
}
