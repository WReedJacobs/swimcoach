import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/context/ToastContext'
import { formatTime } from '@/lib/formatTime'

/**
 * Subscribes to Supabase realtime events for a swimmer's times and feedback.
 * Shows toast notifications when the coach logs a PB or leaves new feedback.
 * Safe to call when swimmerId is undefined — subscription is skipped.
 */
export function useSwimmerRealtime(swimmerId: string | undefined) {
  const addToast = useToast()

  useEffect(() => {
    if (!swimmerId) return

    const channel = supabase
      .channel(`swimmer-${swimmerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'times',
          filter: `swimmer_id=eq.${swimmerId}`,
        },
        (payload) => {
          const row = payload.new as {
            is_pb: boolean
            time_seconds: number
            distance: number
            stroke: string
            is_self_logged: boolean
          }
          // Only toast for times logged by the coach (not self-logged, to avoid echo)
          if (row.is_pb && !row.is_self_logged) {
            addToast({
              type: 'pb',
              message: `New PB! ${row.distance}m ${row.stroke} — ${formatTime(row.time_seconds)}`,
            })
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback',
          filter: `swimmer_id=eq.${swimmerId}`,
        },
        () => {
          addToast({ type: 'feedback', message: 'Your coach left you new feedback' })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [swimmerId, addToast])
}
