import { describe, it, expect } from 'vitest'
import {
  calculateCss,
  paceForDistance,
  buildSetTarget,
  roundUpToInterval,
  PACE_ZONES,
} from './cssCalculator'

describe('calculateCss', () => {
  it('computes speed and pace from a 400/200 trial', () => {
    // 400 in 5:00 (300s), 200 in 2:25 (145s):
    // speed = (400-200)/(300-145) = 200/155 ≈ 1.290 m/s
    // pace/100 = 100/1.290 ≈ 77.5s
    const css = calculateCss(300, 145)!
    expect(css).not.toBeNull()
    expect(css.speedMps).toBeCloseTo(1.2903, 3)
    expect(css.pacePer100).toBeCloseTo(77.5, 1)
  })

  it('rejects a 400 that is not slower than the 200', () => {
    expect(calculateCss(140, 145)).toBeNull()
    expect(calculateCss(145, 145)).toBeNull()
  })

  it('rejects non-finite or non-positive inputs', () => {
    expect(calculateCss(NaN, 145)).toBeNull()
    expect(calculateCss(300, 0)).toBeNull()
    expect(calculateCss(-300, 145)).toBeNull()
  })
})

describe('paceForDistance', () => {
  const pace = 90 // 1:30 / 100m

  it('scales pace linearly with distance at CSS', () => {
    expect(paceForDistance(pace, 100)).toBe(90)
    expect(paceForDistance(pace, 200)).toBe(180)
    expect(paceForDistance(pace, 50)).toBe(45)
  })

  it('applies a per-100 offset (CSS+5 is slower)', () => {
    expect(paceForDistance(pace, 100, 5)).toBe(95)
    expect(paceForDistance(pace, 200, 5)).toBe(190)
  })

  it('returns null for non-positive distance or impossible effective pace', () => {
    expect(paceForDistance(pace, 0)).toBeNull()
    expect(paceForDistance(pace, -100)).toBeNull()
    expect(paceForDistance(10, 100, -20)).toBeNull()
  })
})

describe('roundUpToInterval', () => {
  it('rounds up to the next 5 seconds by default', () => {
    expect(roundUpToInterval(91)).toBe(95)
    expect(roundUpToInterval(95)).toBe(95)
    expect(roundUpToInterval(96)).toBe(100)
  })
  it('honours a custom step and guards bad input', () => {
    expect(roundUpToInterval(91, 10)).toBe(100)
    expect(roundUpToInterval(0)).toBe(0)
    expect(roundUpToInterval(-5)).toBe(0)
  })
})

describe('buildSetTarget', () => {
  it('builds a paced repeat set with a rounded send-off', () => {
    // pace 90s/100, 100m at CSS+5 = 95s, +15s rest = 110 → send-off 110
    const set = buildSetTarget(90, 8, 100, 5, 15)!
    expect(set.reps).toBe(8)
    expect(set.distance).toBe(100)
    expect(set.repSeconds).toBe(95)
    expect(set.sendOffSeconds).toBe(110)
  })

  it('rounds the send-off up to the next 5s', () => {
    // pace 90s/100, 100m at CSS = 90s, +12s rest = 102 → 105
    const set = buildSetTarget(90, 4, 100, 0, 12)!
    expect(set.repSeconds).toBe(90)
    expect(set.sendOffSeconds).toBe(105)
  })

  it('rejects reps < 1 or non-integer reps', () => {
    expect(buildSetTarget(90, 0, 100)).toBeNull()
    expect(buildSetTarget(90, 2.5, 100)).toBeNull()
  })
})

describe('PACE_ZONES', () => {
  it('orders threshold at CSS with recovery slower and sprint faster', () => {
    const threshold = PACE_ZONES.find((z) => z.key === 'threshold')!
    const recovery = PACE_ZONES.find((z) => z.key === 'recovery')!
    const sprint = PACE_ZONES.find((z) => z.key === 'sprint')!
    expect(threshold.offsetPer100).toBe(0)
    expect(recovery.offsetPer100).toBeGreaterThan(0)
    expect(sprint.offsetPer100).toBeLessThan(0)
  })
})
