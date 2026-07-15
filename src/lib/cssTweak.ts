// Milestone 4 — adaptive CSS pacing loop. Pure, framework-agnostic logic
// (no DOM/data-layer deps, unit-tested in isolation from any LLM call),
// sitting alongside cssCalculator.ts.
//
// Compares actual vs. prescribed pace for CSS-anchored sets over a rolling
// window of recent sessions and, if the swimmer is *consistently* beating
// or missing target pace, proposes a tiered CSS adjustment. This module
// never applies anything — it only computes a suggestion; the caller
// decides whether to surface it and the swimmer/coach decides whether to
// accept it (see acceptance criteria: CSS suggestions are never applied
// silently).

/** One CSS-anchored set with both its prescribed and logged-actual pace,
 * both in the same unit (seconds for that set's rep distance) so the
 * ratio between them is a distance-agnostic percentage deviation. */
export interface SetPaceSample {
  sessionId: string
  targetPaceSeconds: number
  actualPaceSeconds: number
}

export type CssTweakTier = 'slight' | 'medium' | 'strong'
export type CssTweakDirection = 'faster' | 'slower'

export interface CssTweakSuggestion {
  tier: CssTweakTier
  /** 'faster' = swimmer is beating pace (CSS looks conservative, tighten
   * it); 'slower' = swimmer is missing pace (CSS looks aggressive, relax
   * it). */
  direction: CssTweakDirection
  /** Signed average deviation across the window, for the user-facing
   * rationale ("~3% conservative") — negative = beating pace. */
  avgDeviationPct: number
  currentPacePer100: number
  suggestedPacePer100: number
}

/** How many of the most recent CSS-anchored sessions must agree before a
 * tweak is suggested — "consistently", not a single good/bad outing. */
export const WINDOW_SESSIONS = 3

/** Detection thresholds (minimum |average deviation| to flag a tier) and
 * the tier's fixed nudge size. The nudge is deliberately decoupled from the
 * raw measured deviation — a bigger tier means "more confident", not
 * "swing the CSS proportionally to whatever the last 3 sessions happened
 * to show" — so one unusually easy/hard session can't produce an outsized
 * suggestion. Ordered strongest-first so the first match wins. */
const TIERS: { tier: CssTweakTier; minAbsDeviationPct: number; stepPct: number }[] = [
  { tier: 'strong', minAbsDeviationPct: 0.06, stepPct: 0.035 },
  { tier: 'medium', minAbsDeviationPct: 0.03, stepPct: 0.02 },
  { tier: 'slight', minAbsDeviationPct: 0.01, stepPct: 0.01 },
]

function average(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

/**
 * `samples` should contain every CSS-anchored set (one with a concrete
 * target_pace_seconds) that has a logged actual, across as many recent
 * sessions as are available — this function takes care of windowing to
 * the most recent WINDOW_SESSIONS distinct session ids, in the order they
 * first appear, so pass samples most-recent-session-first.
 */
export function computeCssTweakSuggestion(
  currentPacePer100: number,
  samples: SetPaceSample[],
): CssTweakSuggestion | null {
  if (!Number.isFinite(currentPacePer100) || currentPacePer100 <= 0) return null

  const bySession = new Map<string, SetPaceSample[]>()
  for (const s of samples) {
    if (!Number.isFinite(s.targetPaceSeconds) || s.targetPaceSeconds <= 0) continue
    if (!Number.isFinite(s.actualPaceSeconds) || s.actualPaceSeconds <= 0) continue
    if (!bySession.has(s.sessionId)) bySession.set(s.sessionId, [])
    bySession.get(s.sessionId)!.push(s)
  }

  const sessionIds = [...bySession.keys()].slice(0, WINDOW_SESSIONS)
  if (sessionIds.length < WINDOW_SESSIONS) return null // not enough data yet

  const perSessionDeviation = sessionIds.map((id) => {
    const sets = bySession.get(id)!
    const deviations = sets.map((s) => (s.actualPaceSeconds - s.targetPaceSeconds) / s.targetPaceSeconds)
    return average(deviations)
  })

  // "Consistently" beating or missing — every session in the window must
  // point the same direction, not just the average across them.
  const allBeating = perSessionDeviation.every((d) => d < 0)
  const allMissing = perSessionDeviation.every((d) => d > 0)
  if (!allBeating && !allMissing) return null

  const avgDeviationPct = average(perSessionDeviation)
  const matched = TIERS.find((t) => Math.abs(avgDeviationPct) >= t.minAbsDeviationPct)
  if (!matched) return null

  const direction: CssTweakDirection = avgDeviationPct < 0 ? 'faster' : 'slower'
  const suggestedPacePer100 =
    direction === 'faster'
      ? currentPacePer100 * (1 - matched.stepPct)
      : currentPacePer100 * (1 + matched.stepPct)

  return {
    tier: matched.tier,
    direction,
    avgDeviationPct,
    currentPacePer100,
    suggestedPacePer100,
  }
}
