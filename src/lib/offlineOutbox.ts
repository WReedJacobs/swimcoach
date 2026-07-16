import type { Stroke, Course } from '@/types'

const OUTBOX_KEY = 'sc_offline_outbox'

export interface OutboxEntry {
  id: string
  swimmer_id: string
  stroke: Stroke
  distance: number
  time_seconds: number
  course: Course
  notes?: string
  session_id?: string | null
  is_self_logged?: boolean
  laps?: number[]
  rpe?: number | null
  queued_at: string
}

export function queueTime(entry: Omit<OutboxEntry, 'id' | 'queued_at'>): void {
  const full: OutboxEntry = {
    ...entry,
    id: crypto.randomUUID(),
    queued_at: new Date().toISOString(),
  }
  localStorage.setItem(OUTBOX_KEY, JSON.stringify([...getQueue(), full]))
}

export function getQueue(): OutboxEntry[] {
  try {
    return JSON.parse(localStorage.getItem(OUTBOX_KEY) ?? '[]') as OutboxEntry[]
  } catch {
    return []
  }
}

export function removeFromQueue(id: string): void {
  localStorage.setItem(
    OUTBOX_KEY,
    JSON.stringify(getQueue().filter((e) => e.id !== id)),
  )
}

export function clearQueue(): void {
  localStorage.removeItem(OUTBOX_KEY)
}
