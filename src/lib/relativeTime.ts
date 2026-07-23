/** "5m ago", "2h ago", "3d ago" — for compact status labels (sync status,
 * last-seen, etc). Pure, no Date.now() side effects beyond the reference
 * clock passed in, so it stays unit-testable. */
export function formatRelativeTime(iso: string | null, now: Date = new Date()): string {
  if (!iso) return 'never'

  const diffMs = now.getTime() - new Date(iso).getTime()
  if (diffMs < 0) return 'just now'

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
