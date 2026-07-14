import { describe, it, expect } from 'vitest'
import {
  weeksUntil,
  taperWeeksFor,
  taperDayRange,
  computePhaseWeeks,
  computeTrainingPlanSkeleton,
} from './trainingPlanPhases'
import type { GoalEventType, PlanPhase } from '@/types'

const EVENT_TYPES: GoalEventType[] = ['pool_sprint', 'pool_middle', 'pool_distance', 'open_water', 'triathlon_leg']

describe('weeksUntil', () => {
  it('floors partial weeks', () => {
    expect(weeksUntil('2026-01-01', '2026-01-08')).toBe(1) // exactly 7 days
    expect(weeksUntil('2026-01-01', '2026-01-09')).toBe(1) // 8 days, still 1 full week
    expect(weeksUntil('2026-01-01', '2026-01-15')).toBe(2) // exactly 14 days
  })

  it('never goes negative for a past date', () => {
    expect(weeksUntil('2026-06-01', '2026-01-01')).toBe(0)
  })

  it('matches hand-counted days for a longer span', () => {
    // Jan 1 -> Apr 1, 2026 (not a leap year): 31 + 28 + 31 = 90 days
    expect(weeksUntil('2026-01-01', '2026-04-01')).toBe(Math.floor(90 / 7))
  })
})

describe('taperDayRange / taperWeeksFor', () => {
  it('matches the spec ranges exactly', () => {
    expect(taperDayRange('pool_sprint')).toEqual({ min: 5, max: 7 })
    expect(taperDayRange('pool_middle')).toEqual({ min: 7, max: 10 })
    expect(taperDayRange('pool_distance')).toEqual({ min: 10, max: 14 })
    expect(taperDayRange('open_water')).toEqual({ min: 10, max: 14 })
    expect(taperDayRange('triathlon_leg')).toEqual({ min: 10, max: 14 })
  })

  it('converts the midpoint day count to whole weeks', () => {
    expect(taperWeeksFor('pool_sprint')).toBe(1) // mid 6 days -> ceil(6/7) = 1
    expect(taperWeeksFor('pool_middle')).toBe(2) // mid 9 days (round(8.5)=9) -> ceil(9/7) = 2
    expect(taperWeeksFor('pool_distance')).toBe(2) // mid 12 days -> ceil(12/7) = 2
    expect(taperWeeksFor('open_water')).toBe(2)
    expect(taperWeeksFor('triathlon_leg')).toBe(2)
  })
})

describe('computePhaseWeeks', () => {
  it('returns empty for zero or negative weeks', () => {
    expect(computePhaseWeeks(0, 'pool_sprint')).toEqual([])
    expect(computePhaseWeeks(-3, 'pool_sprint')).toEqual([])
  })

  it('includes prep when the race is >12 weeks out', () => {
    const weeks = computePhaseWeeks(20, 'pool_sprint')
    expect(weeks.some((w) => w.phase === 'prep')).toBe(true)
    // 40% base, 40% build of 20 weeks, 1 week taper, remainder to prep
    expect(weeks.filter((w) => w.phase === 'base')).toHaveLength(8)
    expect(weeks.filter((w) => w.phase === 'build')).toHaveLength(8)
    expect(weeks.filter((w) => w.phase === 'taper')).toHaveLength(1)
    expect(weeks.filter((w) => w.phase === 'prep')).toHaveLength(3)
  })

  it('omits prep when the race is <=12 weeks out', () => {
    const weeks = computePhaseWeeks(10, 'pool_middle')
    expect(weeks.some((w) => w.phase === 'prep')).toBe(false)
    expect(weeks.filter((w) => w.phase === 'taper')).toHaveLength(2)
    // remaining 8 weeks split evenly base/build
    expect(weeks.filter((w) => w.phase === 'base')).toHaveLength(4)
    expect(weeks.filter((w) => w.phase === 'build')).toHaveLength(4)
  })

  it('clamps taper to the total when the race is imminent', () => {
    const weeks = computePhaseWeeks(1, 'pool_distance') // taper would normally be 2 weeks
    expect(weeks).toHaveLength(1)
    expect(weeks[0].phase).toBe('taper')
  })

  it('assigns contiguous week numbers in phase order with no gaps or overlaps', () => {
    const weeks = computePhaseWeeks(18, 'open_water')
    expect(weeks.map((w) => w.weekNumber)).toEqual(Array.from({ length: weeks.length }, (_, i) => i + 1))
    const order: PlanPhase[] = ['prep', 'base', 'build', 'peak', 'taper']
    let lastRank = -1
    for (const w of weeks) {
      const rank = order.indexOf(w.phase)
      expect(rank).toBeGreaterThanOrEqual(lastRank)
      lastRank = rank
    }
  })

  it('never assigns the peak phase (no rule given for it yet)', () => {
    for (let total = 1; total <= 52; total++) {
      for (const eventType of EVENT_TYPES) {
        expect(computePhaseWeeks(total, eventType).some((w) => w.phase === 'peak')).toBe(false)
      }
    }
  })

  it('invariant: phase weeks always sum to exactly totalWeeks, for every event type and every length', () => {
    for (let total = 1; total <= 52; total++) {
      for (const eventType of EVENT_TYPES) {
        expect(computePhaseWeeks(total, eventType)).toHaveLength(total)
      }
    }
  })
})

describe('computeTrainingPlanSkeleton', () => {
  it('assembles totalWeeks, taper, volume reduction, and phase weeks together', () => {
    const skeleton = computeTrainingPlanSkeleton('2026-01-01', '2026-06-01', 'pool_middle')
    expect(skeleton.totalWeeks).toBe(weeksUntil('2026-01-01', '2026-06-01'))
    expect(skeleton.taperWeeks).toBe(2)
    expect(skeleton.taperDays).toEqual({ min: 7, max: 10 })
    expect(skeleton.volumeReductionPct).toEqual({ min: 40, max: 70 })
    expect(skeleton.weeks).toHaveLength(skeleton.totalWeeks)
  })

  it('volume reduction range is the same regardless of event type — intensity is maintained, only volume drops', () => {
    for (const eventType of EVENT_TYPES) {
      const skeleton = computeTrainingPlanSkeleton('2026-01-01', '2026-06-01', eventType)
      expect(skeleton.volumeReductionPct).toEqual({ min: 40, max: 70 })
    }
  })
})
