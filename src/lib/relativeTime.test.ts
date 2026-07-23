import { describe, it, expect } from 'vitest'
import { formatRelativeTime } from './relativeTime'

const NOW = new Date('2026-01-01T12:00:00Z')

describe('formatRelativeTime', () => {
  it('returns "never" for null', () => {
    expect(formatRelativeTime(null, NOW)).toBe('never')
  })

  it('returns "just now" for under a minute', () => {
    expect(formatRelativeTime('2026-01-01T11:59:30Z', NOW)).toBe('just now')
  })

  it('formats minutes', () => {
    expect(formatRelativeTime('2026-01-01T11:45:00Z', NOW)).toBe('15m ago')
  })

  it('formats hours', () => {
    expect(formatRelativeTime('2026-01-01T09:00:00Z', NOW)).toBe('3h ago')
  })

  it('formats days', () => {
    expect(formatRelativeTime('2025-12-29T12:00:00Z', NOW)).toBe('3d ago')
  })

  it('treats a future timestamp as "just now" rather than negative', () => {
    expect(formatRelativeTime('2026-01-01T12:05:00Z', NOW)).toBe('just now')
  })
})
