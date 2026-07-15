import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { GoalRace, GoalEventType, GoalPriority, Session } from '@/types'

// ─── goal_races CRUD ────────────────────────────────────────────────────────

export function useGoalRaces(swimmerId: string | undefined) {
  return useQuery({
    queryKey: ['goal-races', swimmerId],
    enabled: Boolean(swimmerId),
    queryFn: async (): Promise<GoalRace[]> => {
      const { data, error } = await supabase
        .from('goal_races')
        .select('*')
        .eq('swimmer_id', swimmerId!)
        .order('race_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as GoalRace[]
    },
  })
}

export function useGoalRace(goalRaceId: string | undefined) {
  return useQuery({
    queryKey: ['goal-race', goalRaceId],
    enabled: Boolean(goalRaceId),
    queryFn: async (): Promise<GoalRace> => {
      const { data, error } = await supabase.from('goal_races').select('*').eq('id', goalRaceId!).single()
      if (error) throw error
      return data as GoalRace
    },
  })
}

export interface GoalRaceInsert {
  swimmer_id: string
  coach_id?: string | null
  name: string
  race_date: string
  event_type: GoalEventType
  distance_meters: number
  priority: GoalPriority
  target_time_seconds?: number | null
}

export function useCreateGoalRace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: GoalRaceInsert) => {
      const { data, error } = await supabase.from('goal_races').insert(input).select('*').single()
      if (error) throw error
      return data as GoalRace
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['goal-races', vars.swimmer_id] })
    },
  })
}

export function useDeleteGoalRace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; swimmerId: string }) => {
      const { error } = await supabase.from('goal_races').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['goal-races', vars.swimmerId] })
    },
  })
}

// ─── Generated sessions ─────────────────────────────────────────────────────

/** All sessions (draft + confirmed) belonging to a goal race, oldest first. */
export function useGoalRaceSessions(goalRaceId: string | undefined) {
  return useQuery({
    queryKey: ['goal-race-sessions', goalRaceId],
    enabled: Boolean(goalRaceId),
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('goal_race_id', goalRaceId!)
        .order('date', { ascending: true })
      if (error) throw error
      return (data ?? []) as Session[]
    },
  })
}

// ─── Plan generation ────────────────────────────────────────────────────────

interface GenerateResult {
  success: boolean
  session_ids: string[]
  weeks_generated: number[]
}

/** Extracts the edge function's own {error} JSON body when invoke() surfaces
 * a non-2xx as a generic FunctionsHttpError — its message is otherwise just
 * "Edge Function returned a non-2xx status code", losing the actual reason
 * (e.g. "Race date has already passed"). */
async function functionErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: unknown }).context
    if (context instanceof Response) {
      try {
        const body = await context.json()
        if (body?.error) return body.detail ? `${body.error}: ${body.detail}` : body.error
      } catch {
        // fall through to the generic message below
      }
    }
  }
  return error instanceof Error ? error.message : 'Plan generation failed'
}

/** Generates the full plan (weekNumber omitted) or regenerates a single week
 * (weekNumber set) — same edge function either way, see
 * supabase/functions/generate-training-plan. */
export function useGenerateTrainingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ goalRaceId, weekNumber }: { goalRaceId: string; weekNumber?: number }) => {
      const { data, error } = await supabase.functions.invoke('generate-training-plan', {
        body: { goal_race_id: goalRaceId, week_number: weekNumber },
      })
      if (error) throw new Error(await functionErrorMessage(error))
      return data as GenerateResult
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['goal-race-sessions', vars.goalRaceId] })
    },
  })
}

/** Commits every draft session for a goal race to confirmed — the "approve
 * this plan" action. Regenerating a week afterwards still only replaces
 * that week's drafts (see the edge function), so this is safe to call once
 * up front rather than per-week. */
export function useConfirmPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (goalRaceId: string) => {
      const { error } = await supabase
        .from('sessions')
        .update({ plan_status: 'confirmed' })
        .eq('goal_race_id', goalRaceId)
        .eq('plan_status', 'draft')
      if (error) throw error
    },
    onSuccess: (_d, goalRaceId) => {
      qc.invalidateQueries({ queryKey: ['goal-race-sessions', goalRaceId] })
    },
  })
}
