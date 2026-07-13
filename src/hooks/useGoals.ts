import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Goal, Stroke } from '@/types'

export function useGoals(swimmerId?: string) {
  return useQuery({
    queryKey: ['goals', swimmerId ?? 'all'],
    enabled: swimmerId !== undefined,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('swimmer_id', swimmerId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Goal[]
    },
  })
}

/** Goals across a set of swimmers — used by the coach dashboard. */
export function useGoalsForSwimmers(swimmerIds: string[]) {
  return useQuery({
    queryKey: ['goals-multi', [...swimmerIds].sort()],
    enabled: swimmerIds.length > 0,
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .in('swimmer_id', swimmerIds)
      if (error) throw error
      return (data ?? []) as Goal[]
    },
  })
}

export interface GoalInput {
  swimmer_id: string
  stroke: Stroke
  distance: number
  target_time_seconds: number
  deadline: string | null
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: GoalInput) => {
      const { data, error } = await supabase.from('goals').insert(input).select('*').single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['goals', vars.swimmer_id] })
      qc.invalidateQueries({ queryKey: ['goals-multi'] })
    },
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      swimmerId: _swimmerId,
      ...input
    }: { id: string; swimmerId: string } & Partial<GoalInput>) => {
      const { error } = await supabase
        .from('goals')
        .update({
          stroke: input.stroke,
          distance: input.distance,
          target_time_seconds: input.target_time_seconds,
          deadline: input.deadline ?? null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['goals', vars.swimmerId] })
      qc.invalidateQueries({ queryKey: ['goals-multi'] })
    },
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; swimmerId: string }) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['goals', vars.swimmerId] })
      qc.invalidateQueries({ queryKey: ['goals-multi'] })
    },
  })
}
