// Pure time-formatting helpers. No DOM / framework deps — RN-safe.

/**
 * Convert seconds (float) to a swim-style display string.
 * Under a minute: "47.32". One minute or more: "1:02.45".
 */
export function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '—'
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds - minutes * 60
  const secStr = seconds.toFixed(2).padStart(5, '0') // e.g. "02.45"
  if (minutes === 0) {
    return seconds.toFixed(2) // "47.32"
  }
  return `${minutes}:${secStr}` // "1:02.45"
}

/**
 * Parse a user-typed time string back into seconds.
 * Accepts "47.32", "1:02.45", "1:02", "62.5".
 * Returns null if it can't be parsed.
 */
export function parseTime(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    if (parts.length !== 2) return null
    const minutes = Number(parts[0])
    const seconds = Number(parts[1])
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null
    if (seconds < 0 || seconds >= 60) return null
    return minutes * 60 + seconds
  }

  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0) return null
  return value
}

/**
 * Format a duration for a running stopwatch where centiseconds tick live.
 * Always shows mm:ss.cc style. Input is milliseconds.
 */
export function formatStopwatch(ms: number): string {
  const totalCentis = Math.floor(ms / 10)
  const centis = totalCentis % 100
  const totalSeconds = Math.floor(totalCentis / 100)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`
}
