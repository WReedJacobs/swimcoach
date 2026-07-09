import { describe, it, expect } from 'vitest'
import { isPersonalBest, fastestByEvent, recalcPbFlags } from './pbDetector'
import type { SwimTime } from '../types'

function makeTime(overrides: Partial<SwimTime>): SwimTime {
  return {
    id: 'id-1',
    swimmer_id: 'sw-1',
    coach_id: null,
    session_id: null,
    drill_id: null,
    stroke: 'freestyle',
    distance: 100,
    course: 'SCM',
    time_seconds: 60,
    is_pb: false,
    is_self_logged: false,
    recorded_at: '2024-01-01T00:00:00Z',
    notes: null,
    ...overrides,
  }
}

describe('isPersonalBest', () => {
  it('is always a PB when no existing times', () => {
    expect(isPersonalBest(60, 'freestyle', 100, [], 'SCM')).toBe(true)
  })

  it('is a PB when faster than all existing', () => {
    const existing = [makeTime({ time_seconds: 65 }), makeTime({ time_seconds: 62 })]
    expect(isPersonalBest(60, 'freestyle', 100, existing, 'SCM')).toBe(true)
  })

  it('is not a PB when equal to or slower than fastest', () => {
    const existing = [makeTime({ time_seconds: 60 })]
    expect(isPersonalBest(60, 'freestyle', 100, existing, 'SCM')).toBe(false)
    expect(isPersonalBest(61, 'freestyle', 100, existing, 'SCM')).toBe(false)
  })

  it('ignores times for different stroke or distance', () => {
    const existing = [makeTime({ stroke: 'backstroke', time_seconds: 55 })]
    expect(isPersonalBest(58, 'freestyle', 100, existing, 'SCM')).toBe(true)
  })

  it('treats SCM and LCM as separate PB pools', () => {
    const existing = [makeTime({ course: 'LCM', time_seconds: 55 })]
    // 58s in SCM should be a PB since no SCM times exist
    expect(isPersonalBest(58, 'freestyle', 100, existing, 'SCM')).toBe(true)
  })
})

describe('fastestByEvent', () => {
  it('returns the fastest time per stroke+distance+course', () => {
    const times = [
      makeTime({ id: 'a', time_seconds: 65, course: 'SCM' }),
      makeTime({ id: 'b', time_seconds: 60, course: 'SCM' }),
      makeTime({ id: 'c', time_seconds: 62, course: 'LCM' }),
    ]
    const map = fastestByEvent(times)
    expect(map.get('freestyle-100-SCM')?.id).toBe('b')
    expect(map.get('freestyle-100-LCM')?.id).toBe('c')
  })
})

describe('recalcPbFlags', () => {
  it('marks only the fastest time per event as a PB', () => {
    const times = [
      makeTime({ id: 'a', time_seconds: 65 }),
      makeTime({ id: 'b', time_seconds: 60 }),
      makeTime({ id: 'c', time_seconds: 62 }),
    ]
    const flags = recalcPbFlags(times)
    const map = new Map(flags.map((f) => [f.id, f.is_pb]))
    expect(map.get('a')).toBe(false)
    expect(map.get('b')).toBe(true)
    expect(map.get('c')).toBe(false)
  })

  it('handles empty input', () => {
    expect(recalcPbFlags([])).toEqual([])
  })
})
