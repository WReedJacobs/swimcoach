import { useMemo } from 'react'
import { useTimes } from './useTimes'

/** Consecutive days (ending today) on which the swimmer logged at least one time. */
export function useStreak(swimmerId?: string): number {
  const { data: times } = useTimes(swimmerId)
  return useMemo(() => {
    if (!times?.length) return 0
    const dates = new Set(times.map((t) => t.recorded_at.slice(0, 10)))
    let streak = 0
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    while (dates.has(d.toISOString().slice(0, 10))) {
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }, [times])
}
