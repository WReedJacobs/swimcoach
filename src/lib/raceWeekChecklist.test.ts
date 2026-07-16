import { describe, it, expect } from 'vitest'
import { buildRaceWeekChecklist } from './raceWeekChecklist'

describe('buildRaceWeekChecklist', () => {
  it('includes always-relevant items (no withinDays) at any distance', () => {
    const far = buildRaceWeekChecklist(14)
    expect(far.some((i) => i.id === 'sleep-consistent')).toBe(true)
    expect(far.some((i) => i.id === 'nutrition-hydrate')).toBe(true)
  })

  it('excludes a near-race item when still far out', () => {
    const items = buildRaceWeekChecklist(14)
    expect(items.some((i) => i.id === 'gear-lay-out')).toBe(false)
    expect(items.some((i) => i.id === 'nutrition-familiar-breakfast')).toBe(false)
  })

  it('includes an item exactly at its withinDays boundary', () => {
    const items = buildRaceWeekChecklist(7)
    expect(items.some((i) => i.id === 'gear-check-suit')).toBe(true)
  })

  it('excludes an item one day beyond its withinDays boundary', () => {
    const items = buildRaceWeekChecklist(8)
    expect(items.some((i) => i.id === 'gear-check-suit')).toBe(false)
  })

  it('includes every item on race day (daysToRace = 0)', () => {
    const items = buildRaceWeekChecklist(0)
    expect(items.some((i) => i.id === 'nutrition-familiar-breakfast')).toBe(true)
    expect(items.some((i) => i.id === 'gear-lay-out')).toBe(true)
    expect(items.some((i) => i.id === 'sleep-consistent')).toBe(true)
  })

  it('grows monotonically as race day approaches', () => {
    const counts = [14, 7, 5, 3, 2, 1, 0].map((d) => buildRaceWeekChecklist(d).length)
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1])
    }
  })

  it('covers all four categories by race day', () => {
    const categories = new Set(buildRaceWeekChecklist(0).map((i) => i.category))
    expect(categories).toEqual(new Set(['sleep', 'nutrition', 'logistics', 'gear']))
  })

  it('does not crash for a negative daysToRace (race already happened)', () => {
    expect(() => buildRaceWeekChecklist(-1)).not.toThrow()
    expect(buildRaceWeekChecklist(-1).length).toBe(buildRaceWeekChecklist(0).length)
  })
})
