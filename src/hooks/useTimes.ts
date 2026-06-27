import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isPersonalBest } from '@/lib/pbDetector'
import type { SwimTime, Stroke } from '@/types'

/** All times for a coach, optionally filtered to one swimmer. */
export function useTimes(swimmerId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['times', user?.id, swimmerId ?? 'all'],
    enabled: Boolean(user),
    queryFn: async (): Promise<SwimTime[]> => {
      let q = supabase
        .from('times')
        .select('*')
        .order('recorded_at', { ascending: false })
      if (swimmerId) q = q.eq('swimmer_id', swimmerId)
      else q = q.eq('coach_id', user!.id)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as SwimTime[]
    },
  })
}

export interface LogTimeInput {
  swimmer_id: string
  stroke: Stroke
  distance: number
  time_seconds: number
  notes?: string
  session_id?: string | null
  is_self_logged?: boolean
}

export interface LogTimeResult {
  time: SwimTime
  isPb: boolean
}

export function useDeleteTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('times').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['times'] }),
  })
}

export function useLogTime() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: LogTimeInput): Promise<LogTimeResult> => {
      // Pull existing times for this swimmer to decide PB status.
      const { data: existing, error: exErr } = await supabase
        .from('times')
        .select('*')
        .eq('swimmer_id', input.swimmer_id)
      if (exErr) throw exErr

      const isPb = isPersonalBest(
        input.time_seconds,
        input.stroke,
        input.distance,
        (existing ?? []) as SwimTime[],
      )

      const { data, error } = await supabase
        .from('times')
        .insert({
          swimmer_id: input.swimmer_id,
          coach_id: input.is_self_logged ? null : user?.id ?? null,
          session_id: input.session_id ?? null,
          stroke: input.stroke,
          distance: input.distance,
          time_seconds: input.time_seconds,
          is_pb: isPb,
          is_self_logged: input.is_self_logged ?? false,
          notes: input.notes || null,
        })
        .select('*')
        .single()
      if (error) throw error

      return { time: data as SwimTime, isPb }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['times'] })
    },
  })
}
