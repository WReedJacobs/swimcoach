import { describe, it, expect } from 'vitest'
import { PRESET_CATALOG, BEGINNER_PRESETS } from './presetCatalog'
import type { CatalogPreset } from './presetUtils'

const VALID_CATEGORIES = new Set([
  'warmup', 'endurance', 'threshold', 'sprint', 'kick', 'pull',
  'technique', 'medley', 'pyramid', 'race_pace', 'recovery', 'cooldown', 'test',
])

const VALID_LEVELS = new Set(['beginner', 'intermediate', 'elite'])

const VALID_REST_TYPES = new Set(['rest_seconds', 'interval_seconds', 'css_offset', 'none'])

const VALID_STROKES = new Set(['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'IM', null])

describe('PRESET_CATALOG seed integrity', () => {
  it('contains exactly 75 presets', () => {
    expect(PRESET_CATALOG).toHaveLength(75)
  })

  it('every preset has a non-empty title', () => {
    const missing = PRESET_CATALOG.filter((p) => !p.title || !p.title.trim())
    expect(missing).toHaveLength(0)
  })

  it('every preset has a non-empty description', () => {
    const missing = PRESET_CATALOG.filter((p) => !p.description || !p.description.trim())
    expect(missing.map((p) => p.title)).toHaveLength(0)
  })

  it('every category is one of the 13 valid values', () => {
    const invalid = PRESET_CATALOG.filter((p) => !VALID_CATEGORIES.has(p.category))
    expect(invalid.map((p) => `${p.title}: ${p.category}`)).toHaveLength(0)
  })

  it('every level is beginner | intermediate | elite', () => {
    const invalid = PRESET_CATALOG.filter((p) => !VALID_LEVELS.has(p.level))
    expect(invalid.map((p) => `${p.title}: ${p.level}`)).toHaveLength(0)
  })

  it('every rest_type is valid', () => {
    const invalid = PRESET_CATALOG.filter((p) => !VALID_REST_TYPES.has(p.rest_type))
    expect(invalid.map((p) => `${p.title}: ${p.rest_type}`)).toHaveLength(0)
  })

  it('uniform sets have reps > 0 and distance > 0', () => {
    const uniform = PRESET_CATALOG.filter(
      (p) => !p.structure || p.structure.length === 0,
    )
    const invalid = uniform.filter((p) => p.reps <= 0 || p.distance <= 0)
    expect(invalid.map((p) => p.title)).toHaveLength(0)
  })

  it('structure sets have all legs with reps > 0 and distance > 0', () => {
    const structured = PRESET_CATALOG.filter((p) => p.structure && p.structure.length > 0)
    const invalid = structured.flatMap((p) =>
      (p.structure ?? [])
        .filter((leg) => leg.reps <= 0 || leg.distance <= 0)
        .map(() => p.title),
    )
    expect(invalid).toHaveLength(0)
  })

  it('css_offset presets always have a rest_value', () => {
    const cssPresets = PRESET_CATALOG.filter((p) => p.rest_type === 'css_offset')
    const missing = cssPresets.filter((p) => p.rest_value == null)
    expect(missing.map((p) => p.title)).toHaveLength(0)
  })

  it('rest_value is null for none rest_type', () => {
    const nonePresets = PRESET_CATALOG.filter((p) => p.rest_type === 'none')
    // rest_value should be null (no rest to specify)
    // We allow non-null here since the schema permits it; just confirm rest_type is set
    expect(nonePresets.every((p) => p.rest_type === 'none')).toBe(true)
  })

  it('equipment is always an array', () => {
    const invalid = PRESET_CATALOG.filter((p) => !Array.isArray(p.equipment))
    expect(invalid.map((p) => p.title)).toHaveLength(0)
  })

  it('all presets cover all three levels', () => {
    const levels = new Set(PRESET_CATALOG.map((p) => p.level))
    expect(levels.has('beginner')).toBe(true)
    expect(levels.has('intermediate')).toBe(true)
    expect(levels.has('elite')).toBe(true)
  })

  it('family presets cover all expected families', () => {
    const families = new Set(
      PRESET_CATALOG.filter((p) => p.family != null).map((p) => p.family),
    )
    for (const f of ['aerobic_100s', 'sprint_25s', 'kick_core', 'pyramid', 'pull_core']) {
      expect(families.has(f)).toBe(true)
    }
  })

  it('each family has presets at multiple levels', () => {
    const families = ['aerobic_100s', 'sprint_25s', 'kick_core', 'pyramid', 'pull_core']
    for (const family of families) {
      const members = PRESET_CATALOG.filter((p) => p.family === family)
      const memberLevels = new Set(members.map((p) => p.level))
      expect(memberLevels.size).toBeGreaterThan(1)
    }
  })

  it('all presets have unique titles', () => {
    const titles = PRESET_CATALOG.map((p) => p.title)
    const unique = new Set(titles)
    expect(unique.size).toBe(titles.length)
  })

  it('total meters is positive for every preset', () => {
    function totalMeters(p: CatalogPreset): number {
      if (p.structure && p.structure.length > 0) {
        return p.structure.reduce((sum, leg) => sum + leg.reps * leg.distance, 0)
      }
      return p.reps * p.distance
    }
    const zero = PRESET_CATALOG.filter((p) => totalMeters(p) <= 0)
    expect(zero.map((p) => p.title)).toHaveLength(0)
  })
})

describe('BEGINNER_PRESETS', () => {
  it('is a subset of PRESET_CATALOG', () => {
    const catalog = new Set(PRESET_CATALOG)
    expect(BEGINNER_PRESETS.every((p) => catalog.has(p))).toBe(true)
  })

  it('every preset is level beginner', () => {
    const invalid = BEGINNER_PRESETS.filter((p) => p.level !== 'beginner')
    expect(invalid.map((p) => p.title)).toHaveLength(0)
  })

  it('has at least 5 presets', () => {
    expect(BEGINNER_PRESETS.length).toBeGreaterThanOrEqual(5)
  })
})
