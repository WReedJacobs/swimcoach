// Milestone 5 — basic session-RPE training load flag. Pure, framework-
// agnostic logic (sits alongside cssTweak.ts / cssCalculator.ts), no
// DOM/data-layer deps, unit-testable without touching Supabase.
//
// Per-swim load = distance (m) x RPE (1-10) — the standard session-RPE
// method (Foster et al.), normally duration x RPE; distance is what this
// app actually logs per swim and is a reasonable stand-in given swimmers
// hold roughly steady pace within a single logged swim.
//
// Acute:chronic workload ratio (ACWR): acute = mean daily load over the
// trailing 7 days, chronic = mean daily load over the trailing 28 days,
// ratio = acute / chronic. This is the standard sports-science ACWR
// definition and the one the ~1.5 "flag" threshold is calibrated against
// (see Gabbett et al.) — the build prompt's own "7-day sum vs 28-day
// average" phrasing is read loosely here rather than literally: pairing a
// raw 7-day sum against a per-day average would put a swimmer on a
// completely stable load at a ratio of ~7, not ~1, which can't be what a
// 1.5 danger-zone threshold means.

export interface LoggedLoad {
  /** Local calendar date (YYYY-MM-DD) the swim was recorded on. */
  date: string
  distance: number
  rpe: number | null
}

export interface TrainingLoadResult {
  /** Mean daily load, trailing 7 days (inclusive of asOf). */
  acuteLoad: number
  /** Mean daily load, trailing 28 days (inclusive of asOf). */
  chronicLoad: number
  /** acuteLoad / chronicLoad, or null with no chronic baseline yet. */
  ratio: number | null
  /** Advisory only — never a hard gate. */
  flag: boolean
}

export const ACWR_FLAG_THRESHOLD = 1.5
const ACUTE_WINDOW_DAYS = 7
const CHRONIC_WINDOW_DAYS = 28

/** `asOf` (YYYY-MM-DD) is the reference date the windows are computed
 * relative to — passed in explicitly, rather than defaulting to "today"
 * internally, so this stays pure and testable. */
export function computeTrainingLoad(logs: LoggedLoad[], asOf: string): TrainingLoadResult {
  const asOfMs = Date.parse(`${asOf}T00:00:00`)

  const dailyLoad = new Map<string, number>()
  for (const log of logs) {
    if (log.rpe == null || !Number.isFinite(log.distance) || log.distance <= 0) continue
    const load = log.distance * log.rpe
    dailyLoad.set(log.date, (dailyLoad.get(log.date) ?? 0) + load)
  }

  const sumWithinWindow = (windowDays: number): number => {
    let sum = 0
    for (const [date, load] of dailyLoad) {
      const diffDays = Math.round((asOfMs - Date.parse(`${date}T00:00:00`)) / 86_400_000)
      if (diffDays >= 0 && diffDays < windowDays) sum += load
    }
    return sum
  }

  const acuteLoad = sumWithinWindow(ACUTE_WINDOW_DAYS) / ACUTE_WINDOW_DAYS
  const chronicLoad = sumWithinWindow(CHRONIC_WINDOW_DAYS) / CHRONIC_WINDOW_DAYS
  const ratio = chronicLoad > 0 ? acuteLoad / chronicLoad : null
  const flag = ratio != null && ratio >= ACWR_FLAG_THRESHOLD

  return { acuteLoad, chronicLoad, ratio, flag }
}
