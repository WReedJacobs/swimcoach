import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Message } from '@/types'

/** Unread message count for the current user (for the dashboard stat). */
export function useUnreadCount() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['messages-unread', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user!.id)
        .eq('read', false)
      if (error) throw error
      return count ?? 0
    },
  })
}

/** Full thread between the current user and another participant. */
export function useConversation(otherId: string | undefined) {
  const { user } = useAuth()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['conversation', user?.id, otherId],
    enabled: Boolean(user && otherId),
    queryFn: async (): Promise<Message[]> => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user!.id},recipient_id.eq.${otherId}),` +
            `and(sender_id.eq.${otherId},recipient_id.eq.${user!.id})`,
        )
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Message[]
    },
  })

  // Real-time: refresh the thread when a new message lands for this user.
  useEffect(() => {
    if (!user || !otherId) return
    const channel = supabase
      .channel(`messages-${user.id}-${otherId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          qc.invalidateQueries({ queryKey: ['conversation', user.id, otherId] })
          qc.invalidateQueries({ queryKey: ['messages-unread', user.id] })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, otherId, qc])

  return query
}

export function useSendMessage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      const { error } = await supabase.from('messages').insert({
        sender_id: user!.id,
        recipient_id: recipientId,
        content,
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['conversation', user?.id, vars.recipientId] })
    },
  })
}
