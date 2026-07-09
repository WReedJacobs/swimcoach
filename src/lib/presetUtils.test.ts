import { describe, it, expect } from 'vitest'
import {
  presetTotalMeters,
  renderRest,
  nextPreset,
  presetPattern,
  formatInterval,
  type SetPreset,
  type CatalogPreset,
} from './presetUtils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePreset(overrides: Partial<SetPreset> = {}): SetPreset {
  return {
    id: 'test-id',
    owner_id: null,
    title: 'Test set',
    category: 'endurance',
    level: 'intermediate',
    stroke: null,
    reps: 4,
    distance: 100,
    rest_type: 'rest_seconds',
    rest_value: 30,
    equipment: [],
    description: '',
    structure: null,
    family: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ─── presetTotalMeters ────────────────────────────────────────────────────────

describe('presetTotalMeters', () => {
  it('uniform set: reps * distance', () => {
    expect(presetTotalMeters({ reps: 10, distance: 100, structure: null })).toBe(1000)
  })

  it('single-leg structure', () => {
    const structure = [{ reps: 4, distance: 200 }]
    expect(presetTotalMeters({ reps: 1, distance: 0, structure })).toBe(800)
  })

  it('multi-leg pyramid structure sums correctly', () => {
    const structure = [
      { reps: 1, distance: 100 },
      { reps: 1, distance: 200 },
      { reps: 1, distance: 300 },
      { reps: 1, distance: 200 },
      { reps: 1, distance: 100 },
    ]
    expect(presetTotalMeters({ reps: 1, distance: 0, structure })).toBe(900)
  })

  it('prefers structure over reps/distance when both present', () => {
    const structure = [{ reps: 2, distance: 50 }]
    expect(presetTotalMeters({ reps: 99, distance: 999, structure })).toBe(100)
  })

  it('empty structure falls back to reps * distance', () => {
    // Empty array counts as falsy-length — but we check length > 0 in impl
    expect(presetTotalMeters({ reps: 3, distance: 50, structure: [] })).toBe(150)
  })
})

// ─── formatInterval ───────────────────────────────────────────────────────────

describe('formatInterval', () => {
  it(':30 for 30 seconds', () => {
    expect(formatInterval(30)).toBe(':30')
  })

  it('1:00 for 60 seconds', () => {
    expect(formatInterval(60)).toBe('1:00')
  })

  it('1:45 for 105 seconds', () => {
    expect(formatInterval(105)).toBe('1:45')
  })

  it('pads single-digit seconds', () => {
    expect(formatInterval(65)).toBe('1:05')
  })
})

// ─── renderRest ───────────────────────────────────────────────────────────────

describe('renderRest', () => {
  it('rest_seconds → "30s rest"', () => {
    const p: CatalogPreset = makePreset({ rest_type: 'rest_seconds', rest_value: 30 })
    expect(renderRest(p)).toBe('30s rest')
  })

  it('rest_seconds with null value → "rest"', () => {
    const p = makePreset({ rest_type: 'rest_seconds', rest_value: null })
    expect(renderRest(p)).toBe('rest')
  })

  it('interval_seconds → "on 1:45"', () => {
    const p = makePreset({ rest_type: 'interval_seconds', rest_value: 105 })
    expect(renderRest(p)).toBe('on 1:45')
  })

  it('none → "full recovery"', () => {
    const p = makePreset({ rest_type: 'none', rest_value: null })
    expect(renderRest(p)).toBe('full recovery')
  })

  it('css_offset without CSS data → "@  CSS+5s/100"', () => {
    const p = makePreset({ rest_type: 'css_offset', rest_value: 5, distance: 200 })
    expect(renderRest(p)).toBe('@ CSS+5s/100')
  })

  it('css_offset with CSS data rounds up to 5s', () => {
    // cssPacePer100 = 90s/100m, offset = +5, distance = 200m
    // rawRepPace = (200/100) * (90+5) = 2 * 95 = 190s → ceil to 190 (already multiple of 5)
    const p = makePreset({ rest_type: 'css_offset', rest_value: 5, distance: 200 })
    expect(renderRest(p, 90)).toBe('on 3:10 (CSS+5)')
  })

  it('css_offset rounds up fractional result to next 5s', () => {
    // cssPacePer100 = 92s/100m, offset = +5, distance = 100m
    // rawRepPace = (100/100) * (92+5) = 97s → ceil(97/5)*5 = 100s
    const p = makePreset({ rest_type: 'css_offset', rest_value: 5, distance: 100 })
    expect(renderRest(p, 92)).toBe('on 1:40 (CSS+5)')
  })

  it('css_offset with negative offset shows sign', () => {
    const p = makePreset({ rest_type: 'css_offset', rest_value: -2, distance: 100 })
    expect(renderRest(p)).toBe('@ CSS-2s/100')
  })
})

// ─── presetPattern ────────────────────────────────────────────────────────────

describe('presetPattern', () => {
  it('uniform set: "10×100m"', () => {
    expect(presetPattern({ reps: 10, distance: 100, structure: null })).toBe('10×100m')
  })

  it('single-leg structure with reps: "4×200m"', () => {
    const structure = [{ reps: 4, distance: 200 }]
    expect(presetPattern({ reps: 1, distance: 0, structure })).toBe('4×200m')
  })

  it('single-leg structure with reps=1: just distance', () => {
    const structure = [{ reps: 1, distance: 400 }]
    expect(presetPattern({ reps: 1, distance: 0, structure })).toBe('400m')
  })

  it('multi-leg structure joins with " / "', () => {
    const structure = [
      { reps: 1, distance: 100 },
      { reps: 1, distance: 200 },
      { reps: 1, distance: 100 },
    ]
    expect(presetPattern({ reps: 1, distance: 0, structure })).toBe('100 / 200 / 100')
  })

  it('multi-leg with reps > 1: shows reps×dist', () => {
    const structure = [
      { reps: 2, distance: 50 },
      { reps: 4, distance: 25 },
    ]
    expect(presetPattern({ reps: 1, distance: 0, structure })).toBe('2×50 / 4×25')
  })
})

// ─── nextPreset ───────────────────────────────────────────────────────────────

describe('nextPreset', () => {
  const base = makePreset({ family: 'aerobic_100s', level: 'intermediate' })
  const easier = makePreset({ id: 'b', family: 'aerobic_100s', level: 'beginner' })
  const harder = makePreset({ id: 'e', family: 'aerobic_100s', level: 'elite' })
  const unrelated = makePreset({ id: 'u', family: 'sprint_25s', level: 'elite' })
  const all = [easier, base, harder, unrelated]

  it('harder direction returns elite preset in same family', () => {
    expect(nextPreset(all, base, 'harder')).toBe(harder)
  })

  it('easier direction returns beginner preset in same family', () => {
    expect(nextPreset(all, base, 'easier')).toBe(easier)
  })

  it('returns null when already at hardest level', () => {
    expect(nextPreset(all, harder, 'harder')).toBeNull()
  })

  it('returns null when already at easiest level', () => {
    expect(nextPreset(all, easier, 'easier')).toBeNull()
  })

  it('returns null when preset has no family', () => {
    const noFamily = makePreset({ family: null })
    expect(nextPreset(all, noFamily, 'harder')).toBeNull()
  })

  it('ignores user-owned presets (owner_id !== null) when navigating', () => {
    const ownedElite = makePreset({ id: 'owned', family: 'aerobic_100s', level: 'elite', owner_id: 'user-1' })
    const list = [easier, base, ownedElite]
    expect(nextPreset(list, base, 'harder')).toBeNull()
  })
})
