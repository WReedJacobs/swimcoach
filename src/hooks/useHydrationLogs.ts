import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { localDateStr } from '@/lib/dateLocal'
import type { HydrationLog } from '@/types'

/** Today's fluid-logging taps for the signed-in profile — no calories, no
 * weight, just amount_ml entries. */
export function useTodayHydrationLogs() {
  const { user } = useAuth()
  const startOfDay = `${localDateStr()}T00:00:00`
  return useQuery({
    queryKey: ['hydration-logs', user?.id, localDateStr()],
    enabled: Boolean(user),
    queryFn: async (): Promise<HydrationLog[]> => {
      const { data, error } = await supabase
        .from('hydration_logs')
        .select('*')
        .eq('profile_id', user!.id)
        .gte('logged_at', startOfDay)
        .order('logged_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as HydrationLog[]
    },
  })
}

export function useLogHydration() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (amountMl: number) => {
      const { error } = await supabase
        .from('hydration_logs')
        .insert({ profile_id: user!.id, amount_ml: amountMl })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hydration-logs', user?.id] })
    },
  })
}

export function useDeleteHydrationLog() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('hydration_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hydration-logs', user?.id] })
    },
  })
}
