import { describe, it, expect } from 'vitest'
import {
  goalRaceInputSchema,
  trainingAvailabilitySchema,
  generatedPlanSchema,
} from './goalRaceSchemas'

describe('goalRaceInputSchema', () => {
  it('accepts a valid race', () => {
    const result = goalRaceInputSchema.safeParse({
      name: 'City Champs',
      race_date: '2026-12-01',
      event_type: 'pool_middle',
      distance_meters: 200,
      priority: 'A',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown event_type', () => {
    const result = goalRaceInputSchema.safeParse({
      name: 'City Champs',
      race_date: '2026-12-01',
      event_type: 'marathon',
      distance_meters: 200,
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-positive distance', () => {
    const result = goalRaceInputSchema.safeParse({
      name: 'City Champs',
      race_date: '2026-12-01',
      event_type: 'pool_sprint',
      distance_meters: 0,
    })
    expect(result.success).toBe(false)
  })
})

describe('trainingAvailabilitySchema', () => {
  it('accepts valid availability', () => {
    const result = trainingAvailabilitySchema.safeParse({
      days_per_week: 5,
      session_minutes: 60,
      preferred_days: ['mon', 'wed', 'fri'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects days_per_week over 14', () => {
    const result = trainingAvailabilitySchema.safeParse({
      days_per_week: 15,
      session_minutes: 60,
    })
    expect(result.success).toBe(false)
  })
})

describe('generatedPlanSchema', () => {
  it('accepts a minimal valid plan', () => {
    const result = generatedPlanSchema.safeParse({
      weeks: [
        {
          week_number: 1,
          phase: 'base',
          sessions: [
            {
              title: 'Threshold Tuesday',
              day_of_week: 1,
              sets: [
                {
                  block: 'main_set',
                  set_order: 0,
                  reps: 8,
                  distance_meters: 100,
                  stroke: 'freestyle',
                  target_pace_seconds: 92,
                  rest_seconds: 15,
                },
              ],
            },
          ],
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects a session with zero sets', () => {
    const result = generatedPlanSchema.safeParse({
      weeks: [
        { week_number: 1, phase: 'base', sessions: [{ title: 'Empty', day_of_week: 1, sets: [] }] },
      ],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown phase', () => {
    const result = generatedPlanSchema.safeParse({
      weeks: [{ week_number: 1, phase: 'recovery', sessions: [] }],
    })
    expect(result.success).toBe(false)
  })

  const validWeek = {
    week_number: 1,
    phase: 'base' as const,
    sessions: [{ title: 'Session', day_of_week: 1, sets: [{ block: 'main_set' as const, set_order: 0, reps: 8, distance_meters: 100 }] }],
  }

  it('tolerates a bare week object with the array wrapper dropped', () => {
    const result = generatedPlanSchema.safeParse({ weeks: validWeek })
    expect(result.success).toBe(true)
  })

  it('tolerates the weeks array double-encoded as a JSON string', () => {
    const result = generatedPlanSchema.safeParse({ weeks: JSON.stringify([validWeek]) })
    expect(result.success).toBe(true)
  })

  it('tolerates the whole {weeks:[...]} shape nested one level too deep', () => {
    const result = generatedPlanSchema.safeParse({
      weeks: JSON.stringify({ weeks: [validWeek] }),
    })
    expect(result.success).toBe(true)
  })
})
