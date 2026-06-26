import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Session, SessionType } from '@/types'

export function useSessions() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['sessions', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('coach_id', user!.id)
        .order('date', { ascending: false })
      if (error) throw error
      return (data ?? []) as Session[]
    },
  })
}

/** Today's session for the coach (first match on today's date), if any. */
export function useTodaySession() {
  const { data, ...rest } = useSessions()
  const today = new Date().toISOString().slice(0, 10)
  const todays = data?.find((s) => s.date === today) ?? null
  return { todaySession: todays, ...rest }
}

export interface SessionInput {
  title: string
  date: string
  type: SessionType
  warm_up: string
  main_set: string
  cool_down: string
  notes: string
  swimmerIds: string[]
}

export function useCreateSession() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SessionInput) => {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          coach_id: user!.id,
          title: input.title,
          date: input.date,
          type: input.type,
          warm_up: input.warm_up || null,
          main_set: input.main_set || null,
          cool_down: input.cool_down || null,
          notes: input.notes || null,
        })
        .select('*')
        .single()
      if (error) throw error
      const session = data as Session

      if (input.swimmerIds.length > 0) {
        const rows = input.swimmerIds.map((swimmer_id) => ({
          session_id: session.id,
          swimmer_id,
        }))
        const { error: assignErr } = await supabase
          .from('session_assignments')
          .insert(rows)
        if (assignErr) throw assignErr
      }
      return session
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', user?.id] })
    },
  })
}
