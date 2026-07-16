import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { isPersonalBest, recalcPbFlags } from '@/lib/pbDetector'
import { queueTime } from '@/lib/offlineOutbox'
import { notif } from '@/context/NotificationContext'
import { formatTime } from '@/lib/formatTime'
import type { SwimTime, Split, Stroke, Course } from '@/types'

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
        .limit(500)
      if (swimmerId) q = q.eq('swimmer_id', swimmerId)
      else q = q.eq('coach_id', user!.id)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as SwimTime[]
    },
  })
}

export function useSplits(timeId: string | null) {
  return useQuery({
    queryKey: ['splits', timeId],
    enabled: Boolean(timeId),
    queryFn: async (): Promise<Split[]> => {
      const { data, error } = await supabase
        .from('splits')
        .select('*')
        .eq('time_id', timeId!)
        .order('lap_number', { ascending: true })
      if (error) throw error
      return (data ?? []) as Split[]
    },
  })
}

export interface LogTimeInput {
  swimmer_id: string
  stroke: Stroke
  distance: number
  time_seconds: number
  course?: Course
  notes?: string
  session_id?: string | null
  drill_id?: string | null
  is_self_logged?: boolean
  laps?: number[]
  /** Rate of perceived exertion, 1-10 — optional, feeds Milestone 5's
   * training-load flag (see trainingLoad.ts). */
  rpe?: number | null
}

export interface LogTimeResult {
  time: SwimTime
  isPb: boolean
  queued?: boolean
}

export function useDeleteTime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: t, error: fetchErr } = await supabase
        .from('times')
        .select('swimmer_id')
        .eq('id', id)
        .single()
      if (fetchErr) throw fetchErr
      const { error } = await supabase.from('times').delete().eq('id', id)
      if (error) throw error
      return t.swimmer_id as string
    },
    onSuccess: async (swimmerId) => {
      const { data } = await supabase
        .from('times')
        .select('*')
        .eq('swimmer_id', swimmerId)
      const updates = recalcPbFlags((data ?? []) as SwimTime[])
      await Promise.all(
        updates.map(({ id, is_pb }) =>
          supabase.from('times').update({ is_pb }).eq('id', id),
        ),
      )
      qc.invalidateQueries({ queryKey: ['times'] })
    },
  })
}

export function useLogTime() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: LogTimeInput): Promise<LogTimeResult> => {
      const course: Course = input.course ?? 'SCM'

      // Offline: save to local outbox and surface a silent "queued" error
      // so the global error handler suppresses the toast
      if (!navigator.onLine) {
        queueTime({
          swimmer_id: input.swimmer_id,
          stroke: input.stroke,
          distance: input.distance,
          time_seconds: input.time_seconds,
          course,
          notes: input.notes,
          session_id: input.session_id,
          is_self_logged: input.is_self_logged,
          laps: input.laps,
          rpe: input.rpe,
        })
        const err = Object.assign(
          new Error('Time saved — will sync when back online'),
          { queued: true },
        )
        throw err
      }

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
        course,
      )

      const { data, error } = await supabase
        .from('times')
        .insert({
          swimmer_id: input.swimmer_id,
          coach_id: input.is_self_logged ? null : user?.id ?? null,
          session_id: input.session_id ?? null,
          drill_id: input.drill_id ?? null,
          stroke: input.stroke,
          distance: input.distance,
          course,
          time_seconds: input.time_seconds,
          is_pb: isPb,
          is_self_logged: input.is_self_logged ?? false,
          notes: input.notes || null,
          rpe: input.rpe ?? null,
        })
        .select('*')
        .single()
      if (error) throw error

      const swimTime = data as SwimTime

      if (input.laps && input.laps.length > 0) {
        await supabase.from('splits').insert(
          input.laps.map((split_seconds, i) => ({
            time_id: swimTime.id,
            lap_number: i + 1,
            split_seconds,
          })),
        )
      }

      return { time: swimTime, isPb }
    },
    onSuccess: (result) => {
      if (result.queued) return
      const label = `${result.time.distance}m ${result.time.stroke} (${result.time.course ?? 'SCM'})`
      if (result.isPb) {
        notif.pb(`New PB! ${formatTime(result.time.time_seconds)} — ${label}`)
      } else {
        notif.success(`Time logged: ${formatTime(result.time.time_seconds)} — ${label}`)
      }
      qc.invalidateQueries({ queryKey: ['times'] })
    },
  })
}
