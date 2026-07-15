import { describe, it, expect } from 'vitest'
import { computeCssTweakSuggestion, type SetPaceSample } from './cssTweak'

const CSS = 90 // pace per 100m, seconds

/** Build one session's worth of samples, all deviating from target by the
 * same fraction (negative = swimmer beat the target pace). */
function sessionSamples(sessionId: string, targetPaceSeconds: number, deviationPct: number, count = 1): SetPaceSample[] {
  return Array.from({ length: count }, () => ({
    sessionId,
    targetPaceSeconds,
    actualPaceSeconds: targetPaceSeconds * (1 + deviationPct),
  }))
}

describe('computeCssTweakSuggestion', () => {
  it('returns null with fewer than 3 distinct sessions', () => {
    const samples = [...sessionSamples('s1', 90, -0.05), ...sessionSamples('s2', 90, -0.05)]
    expect(computeCssTweakSuggestion(CSS, samples)).toBeNull()
  })

  it('returns null when direction is inconsistent across the window', () => {
    const samples = [
      ...sessionSamples('s1', 90, -0.05),
      ...sessionSamples('s2', 90, 0.05),
      ...sessionSamples('s3', 90, -0.05),
    ]
    expect(computeCssTweakSuggestion(CSS, samples)).toBeNull()
  })

  it('returns null when deviation is within noise (below slight threshold)', () => {
    const samples = [
      ...sessionSamples('s1', 90, -0.005),
      ...sessionSamples('s2', 90, -0.004),
      ...sessionSamples('s3', 90, -0.006),
    ]
    expect(computeCssTweakSuggestion(CSS, samples)).toBeNull()
  })

  it('flags a slight tier when consistently beating pace by ~1.5%', () => {
    const samples = [
      ...sessionSamples('s1', 90, -0.015),
      ...sessionSamples('s2', 90, -0.015),
      ...sessionSamples('s3', 90, -0.015),
    ]
    const result = computeCssTweakSuggestion(CSS, samples)
    expect(result?.tier).toBe('slight')
    expect(result?.direction).toBe('faster')
    expect(result?.avgDeviationPct).toBeCloseTo(-0.015, 5)
    expect(result?.suggestedPacePer100).toBeCloseTo(CSS * (1 - 0.01), 5)
  })

  it('flags a medium tier when consistently beating pace by ~4%', () => {
    const samples = [
      ...sessionSamples('s1', 90, -0.04),
      ...sessionSamples('s2', 90, -0.04),
      ...sessionSamples('s3', 90, -0.04),
    ]
    const result = computeCssTweakSuggestion(CSS, samples)
    expect(result?.tier).toBe('medium')
    expect(result?.direction).toBe('faster')
    expect(result?.suggestedPacePer100).toBeCloseTo(CSS * (1 - 0.02), 5)
  })

  it('flags a strong tier when consistently beating pace by ~8%', () => {
    const samples = [
      ...sessionSamples('s1', 90, -0.08),
      ...sessionSamples('s2', 90, -0.08),
      ...sessionSamples('s3', 90, -0.08),
    ]
    const result = computeCssTweakSuggestion(CSS, samples)
    expect(result?.tier).toBe('strong')
    expect(result?.direction).toBe('faster')
    expect(result?.suggestedPacePer100).toBeCloseTo(CSS * (1 - 0.035), 5)
  })

  it('flags direction "slower" and relaxes CSS when consistently missing pace', () => {
    const samples = [
      ...sessionSamples('s1', 90, 0.05),
      ...sessionSamples('s2', 90, 0.05),
      ...sessionSamples('s3', 90, 0.05),
    ]
    const result = computeCssTweakSuggestion(CSS, samples)
    expect(result?.tier).toBe('medium')
    expect(result?.direction).toBe('slower')
    expect(result?.suggestedPacePer100).toBeCloseTo(CSS * (1 + 0.02), 5)
  })

  it('averages multiple sets within a single session before comparing across sessions', () => {
    const samples = [
      ...sessionSamples('s1', 90, -0.08, 1),
      ...sessionSamples('s1', 90, -0.02, 1), // session average: -0.05
      ...sessionSamples('s2', 90, -0.05, 2),
      ...sessionSamples('s3', 90, -0.05, 2),
    ]
    const result = computeCssTweakSuggestion(CSS, samples)
    expect(result?.tier).toBe('medium')
    expect(result?.avgDeviationPct).toBeCloseTo(-0.05, 5)
  })

  it('only considers the most recent WINDOW_SESSIONS sessions, ignoring extras', () => {
    // Fourth (oldest) session points the other direction; since only the
    // first 3 encountered sessions are used, it should be ignored entirely.
    const samples = [
      ...sessionSamples('s1', 90, -0.05),
      ...sessionSamples('s2', 90, -0.05),
      ...sessionSamples('s3', 90, -0.05),
      ...sessionSamples('s4', 90, 0.9),
    ]
    const result = computeCssTweakSuggestion(CSS, samples)
    expect(result?.tier).toBe('medium')
    expect(result?.direction).toBe('faster')
  })

  it('ignores samples with non-positive target or actual pace', () => {
    const samples: SetPaceSample[] = [
      { sessionId: 's1', targetPaceSeconds: 0, actualPaceSeconds: 85 },
      ...sessionSamples('s2', 90, -0.05),
      ...sessionSamples('s3', 90, -0.05),
    ]
    expect(computeCssTweakSuggestion(CSS, samples)).toBeNull()
  })

  it('returns null for a non-positive current CSS pace', () => {
    const samples = [
      ...sessionSamples('s1', 90, -0.05),
      ...sessionSamples('s2', 90, -0.05),
      ...sessionSamples('s3', 90, -0.05),
    ]
    expect(computeCssTweakSuggestion(0, samples)).toBeNull()
    expect(computeCssTweakSuggestion(-10, samples)).toBeNull()
  })
})
