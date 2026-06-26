import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Feedback } from '@/types'

export function useFeedback(swimmerId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['feedback', swimmerId ?? 'all', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Feedback[]> => {
      let q = supabase
        .from('feedback')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      if (swimmerId) q = q.eq('swimmer_id', swimmerId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Feedback[]
    },
  })
}

export function useCreateFeedback() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      swimmerId,
      content,
      isPinned,
    }: {
      swimmerId: string
      content: string
      isPinned?: boolean
    }) => {
      const { error } = await supabase.from('feedback').insert({
        coach_id: user!.id,
        swimmer_id: swimmerId,
        content,
        is_pinned: isPinned ?? false,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] })
    },
  })
}
