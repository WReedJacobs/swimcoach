import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { computeCssTweakSuggestion, type SetPaceSample, type CssTweakSuggestion } from '@/lib/cssTweak'
import { useMyCssResult } from './useCssResults'
import type { PlanSetTarget } from '@/types'

/** CSS-anchored (target_pace_seconds set) plan_set_targets for a session,
 * with any already-logged actual pace joined in — what TodaySessionPage
 * needs to render "log your actual pace" inputs next to each prescribed
 * set. Sets without a concrete target_pace_seconds (css_offset_seconds-only
 * or intensity-zone-only) are out of scope for Milestone 4's comparison,
 * same simplification the edge function's own prompt already favours
 * ("prefer target_pace_seconds directly when you have a CSS anchor"). */
export interface CssAnchoredSet extends PlanSetTarget {
  actual_pace_seconds: number | null
  plan_set_result_id: string | null
}

export function useCssAnchoredSets(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['css-anchored-sets', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<CssAnchoredSet[]> => {
      const { data, error } = await supabase
        .from('plan_set_targets')
        .select('*, plan_set_results(id, actual_pace_seconds)')
        .eq('session_id', sessionId!)
        .not('target_pace_seconds', 'is', null)
        .order('block', { ascending: true })
        .order('set_order', { ascending: true })
      if (error) throw error
      return ((data ?? []) as Array<PlanSetTarget & { plan_set_results: { id: string; actual_pace_seconds: number }[] }>).map(
        (row): CssAnchoredSet => {
          const result = row.plan_set_results?.[0] ?? null
          return {
            id: row.id,
            session_id: row.session_id,
            block: row.block,
            set_order: row.set_order,
            set_type: row.set_type,
            reps: row.reps,
            distance_meters: row.distance_meters,
            stroke: row.stroke,
            target_pace_seconds: row.target_pace_seconds,
            css_offset_seconds: row.css_offset_seconds,
            rest_seconds: row.rest_seconds,
            intensity_zone: row.intensity_zone,
            created_at: row.created_at,
            actual_pace_seconds: result?.actual_pace_seconds ?? null,
            plan_set_result_id: result?.id ?? null,
          }
        },
      )
    },
  })
}

/** Upsert (by plan_set_target_id) the swimmer's logged actual pace for one
 * CSS-anchored set — swimmers can correct a value they mis-entered. */
export function useLogPlanSetResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { plan_set_target_id: string; swimmer_id: string; actual_pace_seconds: number; session_id: string }) => {
      const { error } = await supabase
        .from('plan_set_results')
        .upsert(
          {
            plan_set_target_id: input.plan_set_target_id,
            swimmer_id: input.swimmer_id,
            actual_pace_seconds: input.actual_pace_seconds,
          },
          { onConflict: 'plan_set_target_id' },
        )
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['css-anchored-sets', vars.session_id] })
      qc.invalidateQueries({ queryKey: ['css-tweak-suggestion', vars.swimmer_id] })
    },
  })
}

/** Milestone 4's adaptive-pacing suggestion for the signed-in swimmer —
 * fetches recent logged results for CSS-anchored sets and runs them
 * through the pure computeCssTweakSuggestion. A generous limit keeps this
 * a single round-trip; grouping/windowing to the last 3 sessions happens
 * inside the pure function. */
export function useCssTweakSuggestion(swimmerId: string | undefined): {
  data: CssTweakSuggestion | null | undefined
  isLoading: boolean
} {
  const { data: cssResult } = useMyCssResult()
  const query = useQuery({
    queryKey: ['css-tweak-suggestion', swimmerId, cssResult?.pace_per_100],
    enabled: Boolean(swimmerId) && Boolean(cssResult),
    queryFn: async (): Promise<CssTweakSuggestion | null> => {
      const { data, error } = await supabase
        .from('plan_set_results')
        .select('actual_pace_seconds, recorded_at, plan_set_targets(session_id, target_pace_seconds)')
        .eq('swimmer_id', swimmerId!)
        .order('recorded_at', { ascending: false })
        .limit(60)
      if (error) throw error

      type PlanSetTargetRef = { session_id: string; target_pace_seconds: number | null }
      type Row = { actual_pace_seconds: number; plan_set_targets: PlanSetTargetRef | PlanSetTargetRef[] | null }
      const samples: SetPaceSample[] = ((data ?? []) as unknown as Row[])
        .map((r) => ({
          actual_pace_seconds: r.actual_pace_seconds,
          target: Array.isArray(r.plan_set_targets) ? (r.plan_set_targets[0] ?? null) : r.plan_set_targets,
        }))
        .filter((r): r is { actual_pace_seconds: number; target: PlanSetTargetRef } => r.target?.target_pace_seconds != null)
        .map((r) => ({
          sessionId: r.target.session_id,
          targetPaceSeconds: r.target.target_pace_seconds!,
          actualPaceSeconds: r.actual_pace_seconds,
        }))

      return computeCssTweakSuggestion(cssResult!.pace_per_100, samples)
    },
  })
  return { data: query.data, isLoading: query.isLoading }
}
