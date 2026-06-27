import { useLocalStorage } from '@/hooks/useLocalStorage'

export interface BeginnerLog {
  id: string
  date: string
  stroke: string
  distance: number
  timeSeconds: number
}

export interface MilestoneState {
  distance: number
  achievedAt: string | null
}

export const MILESTONES: { label: string; distance: number }[] = [
  { label: 'First 25m', distance: 25 },
  { label: 'First 50m', distance: 50 },
  { label: 'First 100m', distance: 100 },
  { label: 'First 500m', distance: 500 },
  { label: 'First 1km', distance: 1000 },
  { label: 'First 2km', distance: 2000 },
]

export function useBeginnerLogs() {
  return useLocalStorage<BeginnerLog[]>('sc_beginner_logs', [])
}

export function useMilestones() {
  return useLocalStorage<MilestoneState[]>(
    'sc_beginner_milestones',
    MILESTONES.map((m) => ({ distance: m.distance, achievedAt: null })),
  )
}

export function useBeginnerGoal() {
  return useLocalStorage<number>('sc_beginner_goal', 1000)
}
