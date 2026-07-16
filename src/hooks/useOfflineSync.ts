import { useEffect, useState } from 'react'
import { getQueue, removeFromQueue } from '@/lib/offlineOutbox'
import { toast } from '@/context/ToastContext'
import { useLogTime } from './useTimes'

export function useOfflineSync() {
  const logTime = useLogTime()
  const [queueLength, setQueueLength] = useState(() => getQueue().length)

  useEffect(() => {
    const flush = async () => {
      const queue = getQueue()
      if (queue.length === 0) return
      let synced = 0
      for (const entry of queue) {
        try {
          await logTime.mutateAsync({
            swimmer_id: entry.swimmer_id,
            stroke: entry.stroke,
            distance: entry.distance,
            time_seconds: entry.time_seconds,
            course: entry.course,
            notes: entry.notes,
            session_id: entry.session_id,
            is_self_logged: entry.is_self_logged,
            laps: entry.laps,
            rpe: entry.rpe,
          })
          removeFromQueue(entry.id)
          synced++
        } catch {
          // Will retry on next online event
        }
      }
      if (synced > 0) {
        toast.success(`Synced ${synced} queued time${synced !== 1 ? 's' : ''}`)
      }
      setQueueLength(getQueue().length)
    }

    window.addEventListener('online', flush)
    if (navigator.onLine && getQueue().length > 0) flush()
    return () => window.removeEventListener('online', flush)
  }, [logTime])

  return { queueLength }
}
