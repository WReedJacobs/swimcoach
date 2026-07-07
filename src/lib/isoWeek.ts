/**
 * Returns an ISO 8601 week key for the given date, e.g. "2024-W03".
 * Week 1 is the week containing the first Thursday of the year (same as
 * PostgreSQL's TO_CHAR(date, 'IYYY-IW')).
 */
export function isoWeekKey(date: Date): string {
  // Work in UTC to avoid DST shifts moving across midnight
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Shift to Thursday of the same ISO week (Mon=1…Sun=7, Sunday treated as 7)
  const dow = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dow)
  const isoYear = d.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7)
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}
