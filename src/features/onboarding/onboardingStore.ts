import { useLocalStorage } from '@/hooks/useLocalStorage'
import type { Level, Stroke } from '@/types'

/**
 * The anonymous onboarding draft (Workstream 3, fix #1: the account wall).
 * Everything a prospective swimmer does before signing up is captured here in
 * localStorage, so sign-up is gated only at the final "save" step — we convert
 * on commitment, not on arrival.
 */
export interface OnboardingDraft {
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
  /** Smart default first session (fix #3: edit-not-author). */
  session: { stroke: Stroke; distanceMeters: number; timeSeconds: number; setLabel: string }
}

/** Per-level smart defaults that pre-fill the first-session log. */
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
  elite: {
    level: 'elite',
    title: 'Elite',
    blurb: 'Training competitively',
    weeklyGoalMeters: 15000,
    session: { stroke: 'freestyle', distanceMeters: 1000, timeSeconds: 900, setLabel: '10 × 100m on a tight interval' },
  },
}

const DEFAULT_DRAFT: OnboardingDraft = {
  level: null,
  weeklyGoalMeters: LEVEL_TEMPLATES.intermediate.weeklyGoalMeters,
  session: { ...LEVEL_TEMPLATES.intermediate.session },
  deviceConnected: false,
}

export function useOnboardingDraft() {
  return useLocalStorage<OnboardingDraft>('sc_onboarding_draft', DEFAULT_DRAFT)
}

/** Live pace in seconds per 100m, or null if not computable. */
export function pacePer100(distanceMeters: number, timeSeconds: number): number | null {
  if (distanceMeters <= 0 || timeSeconds <= 0) return null
  return (timeSeconds / distanceMeters) * 100
}
