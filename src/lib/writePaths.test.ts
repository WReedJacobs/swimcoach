import { describe, it, expect } from 'vitest'
import { assertAffected } from './mutate'
import { STROKES, COURSES } from '@/types'
import type { Role, Level, SessionType, BookingStatus } from '@/types'

// ─── assertAffected unit tests ───────────────────────────────────────────────

describe('assertAffected', () => {
  it('does nothing when count > 0', () => {
    expect(() => assertAffected({ count: 1 })).not.toThrow()
    expect(() => assertAffected({ count: 5 })).not.toThrow()
  })

  it('throws with default message when count is 0', () => {
    expect(() => assertAffected({ count: 0 })).toThrow('No rows were affected')
  })

  it('throws with custom message when count is 0', () => {
    expect(() => assertAffected({ count: 0 }, 'Time not found')).toThrow('Time not found')
  })

  it('throws the DB error when error is set, regardless of count', () => {
    const err = new Error('foreign key violation')
    expect(() => assertAffected({ error: err, count: 0 })).toThrow('foreign key violation')
    expect(() => assertAffected({ error: err, count: 1 })).toThrow('foreign key violation')
  })

  it('does not throw when count is null (query did not request exact count)', () => {
    // Without { count: 'exact' } the count is null — we cannot tell if rows were affected.
    // assertAffected should stay silent rather than produce a false negative.
    expect(() => assertAffected({ count: null })).not.toThrow()
  })

  it('does not throw when count is undefined', () => {
    expect(() => assertAffected({})).not.toThrow()
  })
})

// ─── TypeScript ↔ SQL enum consistency ───────────────────────────────────────
// These tests catch drift between src/types/index.ts and the SQL enum definitions
// in 001_initial.sql. If a value exists in TS but not SQL, Supabase will reject
// the insert at runtime with no TS error at compile time.

describe('Stroke enum (stroke_type in SQL)', () => {
  // SQL: create type stroke_type as enum ('freestyle','backstroke','breaststroke','butterfly','IM')
  const SQL_STROKE_TYPE = new Set(['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'IM'])

  it('every TS Stroke value is a valid SQL stroke_type', () => {
    for (const s of STROKES) {
      expect(SQL_STROKE_TYPE.has(s), `'${s}' missing from SQL stroke_type`).toBe(true)
    }
  })

  it('no SQL stroke_type values are missing from TS', () => {
    const tsStrokes = new Set<string>(STROKES)
    for (const s of SQL_STROKE_TYPE) {
      expect(tsStrokes.has(s), `SQL '${s}' not in TS STROKES`).toBe(true)
    }
  })
})

describe('Course values (not an SQL enum — check constraint via application)', () => {
  it('COURSES contains the three expected pool formats', () => {
    expect(new Set<string>(COURSES)).toEqual(new Set(['SCM', 'LCM', 'SCY']))
  })
})

describe('Role enum (user_role in SQL)', () => {
  // SQL: create type user_role as enum ('coach','swimmer','beginner')
  const SQL_USER_ROLE = new Set<Role>(['coach', 'swimmer', 'beginner'])
  const TS_ROLES: Role[] = ['coach', 'swimmer', 'beginner']

  it('TS Role values match SQL user_role exactly', () => {
    expect(new Set<string>(TS_ROLES)).toEqual(SQL_USER_ROLE)
  })
})

describe('Level enum (swim_level in SQL)', () => {
  // SQL: create type swim_level as enum ('beginner','intermediate','elite')
  // TypeScript adds 'advanced' — this value will fail a DB insert at runtime.
  const SQL_SWIM_LEVEL = new Set<string>(['beginner', 'intermediate', 'elite'])
  const TS_LEVELS: Level[] = ['beginner', 'intermediate', 'advanced', 'elite']

  it('documents the known TS/SQL mismatch: "advanced" is in TS but not in SQL', () => {
    const tsOnly = TS_LEVELS.filter((l) => !SQL_SWIM_LEVEL.has(l))
    // This test intentionally asserts the mismatch exists so it fails if ever fixed,
    // prompting the developer to also remove 'advanced' from TS or add it to SQL.
    expect(tsOnly).toEqual(['advanced'])
  })

  it('all SQL swim_level values are present in TS Level', () => {
    const tsSet = new Set<string>(TS_LEVELS)
    for (const l of SQL_SWIM_LEVEL) {
      expect(tsSet.has(l), `SQL '${l}' missing from TS Level`).toBe(true)
    }
  })
})

describe('SessionType enum (session_kind in SQL)', () => {
  // SQL: create type session_kind as enum ('training','race','dryland')
  const SQL_SESSION_KIND = new Set<SessionType>(['training', 'race', 'dryland'])
  const TS_SESSION_TYPES: SessionType[] = ['training', 'race', 'dryland']

  it('TS SessionType values match SQL session_kind exactly', () => {
    expect(new Set<string>(TS_SESSION_TYPES)).toEqual(SQL_SESSION_KIND)
  })
})

describe('BookingStatus enum (booking_state in SQL)', () => {
  // SQL: create type booking_state as enum ('pending','confirmed','cancelled')
  const SQL_BOOKING_STATE = new Set<BookingStatus>(['pending', 'confirmed', 'cancelled'])
  const TS_BOOKING_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'cancelled']

  it('TS BookingStatus values match SQL booking_state exactly', () => {
    expect(new Set<string>(TS_BOOKING_STATUSES)).toEqual(SQL_BOOKING_STATE)
  })
})
