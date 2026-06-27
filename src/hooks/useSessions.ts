import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Session, SessionType } from '@/types'

export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<Session> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId!)
        .single()
      if (error) throw error
      return data as Session
    },
  })
}

export function useSessionAssignments(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['session-assignments', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('session_assignments')
        .select('swimmer_id')
        .eq('session_id', sessionId!)
      if (error) throw error
      return (data ?? []).map((r) => r.swimmer_id as string)
    },
  })
}

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

export function useUpdateSession() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, swimmerIds, ...input }: { id: string; swimmerIds?: string[] } & Partial<SessionInput>) => {
      const { error } = await supabase
        .from('sessions')
        .update({
          title: input.title,
          date: input.date,
          type: input.type,
          warm_up: input.warm_up || null,
          main_set: input.main_set || null,
          cool_down: input.cool_down || null,
          notes: input.notes || null,
        })
        .eq('id', id)
      if (error) throw error

      if (swimmerIds !== undefined) {
        await supabase.from('session_assignments').delete().eq('session_id', id)
        if (swimmerIds.length > 0) {
          const { error: assignErr } = await supabase
            .from('session_assignments')
            .insert(swimmerIds.map((swimmer_id) => ({ session_id: id, swimmer_id })))
          if (assignErr) throw assignErr
        }
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sessions', user?.id] })
      qc.invalidateQueries({ queryKey: ['session', vars.id] })
      qc.invalidateQueries({ queryKey: ['session-assignments', vars.id] })
    },
  })
}

export function useDeleteSession() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sessions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions', user?.id] }),
  })
}

export interface AssignmentRow {
  id: string
  session_id: string
  swimmer_id: string
  attended: boolean
  display_name: string
}

/** All session assignments for the coach, with swimmer display names. */
export function useAllSessionAssignments() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['all-session-assignments', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<AssignmentRow[]> => {
      const { data, error } = await supabase
        .from('session_assignments')
        .select('id, session_id, swimmer_id, attended, swimmers(display_name)')
      if (error) throw error
      return ((data ?? []) as unknown as Array<{
        id: string
        session_id: string
        swimmer_id: string
        attended: boolean
        swimmers: { display_name: string } | { display_name: string }[] | null
      }>).map((r) => {
        const sw = Array.isArray(r.swimmers) ? r.swimmers[0] : r.swimmers
        return {
          id: r.id,
          session_id: r.session_id,
          swimmer_id: r.swimmer_id,
          attended: r.attended,
          display_name: sw?.display_name ?? 'Swimmer',
        }
      })
    },
  })
}

export function useMarkAttendance() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ assignmentId, attended }: { assignmentId: string; attended: boolean }) => {
      const { error } = await supabase
        .from('session_assignments')
        .update({ attended })
        .eq('id', assignmentId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all-session-assignments', user?.id] }),
  })
}
