import { describe, it, expect } from 'vitest'
import { computeTrainingLoad, ACWR_FLAG_THRESHOLD, type LoggedLoad } from './trainingLoad'

const ASOF = '2026-07-28'

/** n days before ASOF, as YYYY-MM-DD (local time, matching how
 * computeTrainingLoad parses date strings — toISOString() would drift by
 * a day depending on the runner's timezone offset). */
function daysBefore(n: number): string {
  const d = new Date(`${ASOF}T00:00:00`)
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('computeTrainingLoad', () => {
  it('returns null ratio and no flag with no logs at all', () => {
    const result = computeTrainingLoad([], ASOF)
    expect(result.acuteLoad).toBe(0)
    expect(result.chronicLoad).toBe(0)
    expect(result.ratio).toBeNull()
    expect(result.flag).toBe(false)
  })

  it('ignores logs with a null RPE', () => {
    const logs: LoggedLoad[] = [{ date: ASOF, distance: 1000, rpe: null }]
    const result = computeTrainingLoad(logs, ASOF)
    expect(result.acuteLoad).toBe(0)
    expect(result.chronicLoad).toBe(0)
  })

  it('produces a ratio of ~1 for a perfectly stable daily load', () => {
    // Same load every day for the full chronic window.
    const logs: LoggedLoad[] = Array.from({ length: CHRONIC_DAYS() }, (_, i) => ({
      date: daysBefore(i),
      distance: 1000,
      rpe: 5,
    }))
    const result = computeTrainingLoad(logs, ASOF)
    expect(result.ratio).toBeCloseTo(1, 5)
    expect(result.flag).toBe(false)
  })

  it('flags a genuine spike: high recent load against a much lower baseline', () => {
    const logs: LoggedLoad[] = [
      // Last 7 days: heavy load every day.
      ...Array.from({ length: 7 }, (_, i) => ({ date: daysBefore(i), distance: 2000, rpe: 9 })),
      // Days 7-27: light load every day (fills out the chronic window).
      ...Array.from({ length: 21 }, (_, i) => ({ date: daysBefore(i + 7), distance: 500, rpe: 3 })),
    ]
    const result = computeTrainingLoad(logs, ASOF)
    expect(result.ratio).not.toBeNull()
    expect(result.ratio!).toBeGreaterThan(ACWR_FLAG_THRESHOLD)
    expect(result.flag).toBe(true)
  })

  it('does not flag a mild, sub-threshold increase', () => {
    const logs: LoggedLoad[] = [
      ...Array.from({ length: 7 }, (_, i) => ({ date: daysBefore(i), distance: 1100, rpe: 5 })),
      ...Array.from({ length: 21 }, (_, i) => ({ date: daysBefore(i + 7), distance: 1000, rpe: 5 })),
    ]
    const result = computeTrainingLoad(logs, ASOF)
    expect(result.ratio!).toBeLessThan(ACWR_FLAG_THRESHOLD)
    expect(result.flag).toBe(false)
  })

  it('excludes logs outside the chronic window (day 28+)', () => {
    const inWindow: LoggedLoad = { date: daysBefore(27), distance: 1000, rpe: 5 }
    const outOfWindow: LoggedLoad = { date: daysBefore(28), distance: 100_000, rpe: 10 }
    const withOutlier = computeTrainingLoad([inWindow, outOfWindow], ASOF)
    const without = computeTrainingLoad([inWindow], ASOF)
    expect(withOutlier.chronicLoad).toBeCloseTo(without.chronicLoad, 5)
  })

  it('excludes logs outside the acute window (day 7+) from acuteLoad but keeps them in chronicLoad', () => {
    const logs: LoggedLoad[] = [{ date: daysBefore(10), distance: 1000, rpe: 5 }]
    const result = computeTrainingLoad(logs, ASOF)
    expect(result.acuteLoad).toBe(0)
    expect(result.chronicLoad).toBeGreaterThan(0)
  })

  it('sums multiple logs on the same day', () => {
    const logs: LoggedLoad[] = [
      { date: ASOF, distance: 500, rpe: 4 },
      { date: ASOF, distance: 500, rpe: 4 },
    ]
    const result = computeTrainingLoad(logs, ASOF)
    // 2 x (500*4) = 4000 total that day, averaged over 7 acute days.
    expect(result.acuteLoad).toBeCloseTo(4000 / 7, 5)
  })

  it('ignores non-positive distance', () => {
    const logs: LoggedLoad[] = [{ date: ASOF, distance: 0, rpe: 8 }]
    const result = computeTrainingLoad(logs, ASOF)
    expect(result.acuteLoad).toBe(0)
  })

  it('includes asOf itself in both windows (day 0)', () => {
    const logs: LoggedLoad[] = [{ date: ASOF, distance: 1000, rpe: 5 }]
    const result = computeTrainingLoad(logs, ASOF)
    expect(result.acuteLoad).toBeGreaterThan(0)
    expect(result.chronicLoad).toBeGreaterThan(0)
  })
})

function CHRONIC_DAYS() {
  return 28
}
