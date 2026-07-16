import { useMemo } from 'react'
import { useTimes } from './useTimes'
import { computeTrainingLoad, type TrainingLoadResult } from '@/lib/trainingLoad'
import { localDateStr } from '@/lib/dateLocal'

/** Milestone 5 — acute:chronic training-load ratio for one swimmer, from
 * their own logged times (regardless of who logged them — coach or
 * self — unlike the coach-wide useTimes(), this is always scoped to a
 * single swimmer_id so it isn't affected by the coach_id/is_self_logged
 * split). Advisory only; see trainingLoad.ts. */
export function useTrainingLoad(swimmerId: string | undefined): {
  data: TrainingLoadResult | undefined
  isLoading: boolean
} {
  const { data: times, isLoading } = useTimes(swimmerId)

  const data = useMemo(() => {
    if (!times) return undefined
    const today = localDateStr()
    const logs = times.map((t) => ({
      date: localDateStr(new Date(t.recorded_at)),
      distance: t.distance,
      rpe: t.rpe,
    }))
    return computeTrainingLoad(logs, today)
  }, [times])

  return { data, isLoading }
}
