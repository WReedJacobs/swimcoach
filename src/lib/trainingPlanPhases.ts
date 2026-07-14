// Deterministic phase/taper math for the goal-race training plan generator
// (Milestone 2). This is sports science, not something left to the LLM's
// judgment — the LLM only fills in set design within the boundaries this
// file computes. Framework-agnostic, DOM-free, unit-tested in isolation
// from the LLM call (see trainingPlanPhases.test.ts).
// Relative import with an explicit /index.ts, not the '@/' alias or a bare
// directory import — this file is also imported directly (via a relative
// path) by the generate-training-plan edge function. Deno doesn't
// understand Vite's path aliases or do directory-index resolution the way
// Vite/tsc do; allowImportingTsExtensions (tsconfig.json) makes this
// explicit form work identically on both sides.
import type { GoalEventType, PlanPhase } from '../types/index.ts'

export interface DayRange {
  min: number
  max: number
}

export interface PhaseWeekAllocation {
  weekNumber: number
  phase: PlanPhase
}

export interface TrainingPlanSkeleton {
  totalWeeks: number
  taperDays: DayRange
  taperWeeks: number
  /** Same for every event type — intensity is maintained, only volume drops. */
  volumeReductionPct: DayRange
  weeks: PhaseWeekAllocation[]
}

// ─── Taper length by event type ────────────────────────────────────────────
// Ranges as specified; TAPER_DAYS is the deterministic midpoint used for
// scheduling (a single day count is needed to compute whole weeks), while
// the full range still gets passed to the LLM prompt as context.
const TAPER_DAY_RANGE: Record<GoalEventType, DayRange> = {
  pool_sprint: { min: 5, max: 7 },
  pool_middle: { min: 7, max: 10 },
  pool_distance: { min: 10, max: 14 },
  open_water: { min: 10, max: 14 },
  triathlon_leg: { min: 10, max: 14 },
}

const TAPER_VOLUME_REDUCTION_PCT: DayRange = { min: 40, max: 70 }

export function taperDayRange(eventType: GoalEventType): DayRange {
  return TAPER_DAY_RANGE[eventType]
}

/** Whole weeks of taper, from the midpoint of the event's day range. */
export function taperWeeksFor(eventType: GoalEventType): number {
  const { min, max } = TAPER_DAY_RANGE[eventType]
  const midDays = Math.round((min + max) / 2)
  return Math.max(1, Math.ceil(midDays / 7))
}

/**
 * Whole weeks between today and race_date, both YYYY-MM-DD. Floors partial
 * weeks (a race 9 days out is 1 week available, not 2) and never returns
 * less than 0 — callers should treat 0 as "too late to generate a plan."
 */
export function weeksUntil(today: string, raceDate: string): number {
  const start = new Date(`${today}T00:00:00`)
  const end = new Date(`${raceDate}T00:00:00`)
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000)
  return Math.max(0, Math.floor(days / 7))
}

/**
 * Allocates every week of the plan to a phase. Prep only appears when the
 * race is genuinely far out (>12 weeks); Base and Build roughly split 40%
 * of the total each, Taper is the fixed length above, and Prep absorbs
 * whatever's left over — this order matches the build prompt's own
 * "Prep (if >12 weeks out) -> Base -> Build -> Peak/Taper" sequence.
 *
 * The 'peak' enum value exists in the schema but isn't assigned by this
 * calculator — the prompt gives no separate day/week rule for a peak
 * sub-period distinct from taper's own explicit length/volume rules, so
 * splitting the taper block into peak+taper sub-phases would be an
 * invented ratio, not a computed one. Reserved for a future refinement
 * where that ratio is actually specified.
 *
 * Invariant (see tests): the returned weeks always sum to exactly
 * totalWeeks, for every event type and every totalWeeks >= 1.
 */
export function computePhaseWeeks(totalWeeks: number, eventType: GoalEventType): PhaseWeekAllocation[] {
  if (totalWeeks < 1) return []

  const taperWeeks = Math.min(taperWeeksFor(eventType), totalWeeks)
  const remaining = totalWeeks - taperWeeks

  let prepWeeks = 0
  let baseWeeks: number
  let buildWeeks: number

  if (totalWeeks > 12) {
    baseWeeks = Math.round(totalWeeks * 0.4)
    buildWeeks = Math.round(totalWeeks * 0.4)
    prepWeeks = Math.max(0, remaining - baseWeeks - buildWeeks)
    // Rounding (three independent Math.round calls) can overshoot the
    // total by a week either way — reconcile against base, the phase
    // with the least sensitive boundary, so the invariant always holds.
    const drift = prepWeeks + baseWeeks + buildWeeks - remaining
    baseWeeks -= drift
    if (baseWeeks < 0) {
      buildWeeks += baseWeeks
      baseWeeks = 0
    }
  } else {
    // Race too close for a prep phase — split the non-taper weeks evenly
    // between base and build instead of the 40%-of-total formula, which
    // would otherwise leave weeks unaccounted for.
    baseWeeks = Math.ceil(remaining / 2)
    buildWeeks = remaining - baseWeeks
  }

  const weeks: PhaseWeekAllocation[] = []
  let n = 1
  const push = (count: number, phase: PlanPhase) => {
    for (let i = 0; i < count; i++) weeks.push({ weekNumber: n++, phase })
  }
  push(prepWeeks, 'prep')
  push(baseWeeks, 'base')
  push(buildWeeks, 'build')
  push(taperWeeks, 'taper')

  return weeks
}

export function computeTrainingPlanSkeleton(
  today: string,
  raceDate: string,
  eventType: GoalEventType,
): TrainingPlanSkeleton {
  const totalWeeks = weeksUntil(today, raceDate)
  return {
    totalWeeks,
    taperDays: taperDayRange(eventType),
    taperWeeks: taperWeeksFor(eventType),
    volumeReductionPct: TAPER_VOLUME_REDUCTION_PCT,
    weeks: computePhaseWeeks(totalWeeks, eventType),
  }
}
