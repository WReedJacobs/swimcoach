import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Level, Stroke } from '@/types'

export type OnboardingRole = 'coach' | 'swimmer'

export interface OnboardingDraft {
  onboardingRole: OnboardingRole | null
  level: Level | null
  weeklyGoalMeters: number
  session: {
    stroke: Stroke
    distanceMeters: number
    timeSeconds: number
  }
  deviceConnected: boolean
}

export interface LevelTemplate {
  level: Level
  title: string
  blurb: string
  weeklyGoalMeters: number
  session: { stroke: Stroke; distanceMeters: number; timeSeconds: number; setLabel: string }
}

export const LEVEL_TEMPLATES: Record<Level, LevelTemplate> = {
  beginner: {
    level: 'beginner',
    title: 'Beginner',
    blurb: 'New to lap swimming',
    weeklyGoalMeters: 2000,
    session: { stroke: 'freestyle', distanceMeters: 200, timeSeconds: 360, setLabel: '4 × 50m freestyle, easy' },
  },
  intermediate: {
    level: 'intermediate',
    title: 'Intermediate',
    blurb: 'Comfortable past 1km',
    weeklyGoalMeters: 6000,
    session: { stroke: 'freestyle', distanceMeters: 800, timeSeconds: 840, setLabel: '8 × 100m freestyle' },
  },
  advanced: {
    level: 'advanced',
    title: 'Advanced',
    blurb: 'Strong fitness base, training regularly',
    weeklyGoalMeters: 12000,
    session: { stroke: 'freestyle', distanceMeters: 1000, timeSeconds: 960, setLabel: '10 × 100m at CSS pace' },
  },
  elite: {
    level: 'elite',
    title: 'Elite',
    blurb: 'Training competitively',
    weeklyGoalMeters: 15000,
    session: { stroke: 'freestyle', distanceMeters: 1000, timeSeconds: 900, setLabel: '10 × 100m on a tight interval' },
  },
}

const DEFAULT_DRAFT: OnboardingDraft = {
  onboardingRole: null,
  level: null,
  weeklyGoalMeters: LEVEL_TEMPLATES.intermediate.weeklyGoalMeters,
  session: { ...LEVEL_TEMPLATES.intermediate.session },
  deviceConnected: false,
}

export function useOnboardingDraft() {
  return useLocalStorage<OnboardingDraft>('sc_onboarding_draft', DEFAULT_DRAFT)
}

export function pacePer100(distanceMeters: number, timeSeconds: number): number | null {
  if (distanceMeters <= 0 || timeSeconds <= 0) return null
  return (timeSeconds / distanceMeters) * 100
}
