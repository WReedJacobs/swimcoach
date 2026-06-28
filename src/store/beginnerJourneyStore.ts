import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { JOURNEY_STAGES, STAGE_ORDER, ALL_STEP_IDS } from '@/features/beginner/journeySteps'

type Stage = 'explorer' | 'learner' | 'ready'

interface JourneyState {
  completedSteps: string[]
  currentStage: Stage
  graduationPromptSeen: boolean

  markStep: (stepId: string) => void
  hasCompleted: (stepId: string) => boolean
  isStageComplete: (stageId: Stage) => boolean
  isAllComplete: () => boolean
  setGraduationSeen: () => void
  currentStepInStage: (stageId: Stage) => string | null
}

function computeStage(completedSteps: string[]): Stage {
  for (let i = STAGE_ORDER.length - 1; i >= 0; i--) {
    const stage = STAGE_ORDER[i]
    const prevComplete = i === 0 || JOURNEY_STAGES.slice(0, i).every((s) =>
      s.steps.every((st) => completedSteps.includes(st.id)),
    )
    if (prevComplete) return stage
  }
  return 'explorer'
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set, get) => ({
      completedSteps: [],
      currentStage: 'explorer',
      graduationPromptSeen: false,

      markStep: (stepId) => {
        if (!ALL_STEP_IDS.includes(stepId)) return
        const prev = get().completedSteps
        if (prev.includes(stepId)) return
        const next = [...prev, stepId]
        set({ completedSteps: next, currentStage: computeStage(next) })
      },

      hasCompleted: (stepId) => get().completedSteps.includes(stepId),

      isStageComplete: (stageId) => {
        const stage = JOURNEY_STAGES.find((s) => s.id === stageId)
        if (!stage) return false
        return stage.steps.every((st) => get().completedSteps.includes(st.id))
      },

      isAllComplete: () => ALL_STEP_IDS.every((id) => get().completedSteps.includes(id)),

      setGraduationSeen: () => set({ graduationPromptSeen: true }),

      currentStepInStage: (stageId) => {
        const stage = JOURNEY_STAGES.find((s) => s.id === stageId)
        if (!stage) return null
        const completed = get().completedSteps
        return stage.steps.find((st) => !completed.includes(st.id))?.id ?? null
      },
    }),
    { name: 'swimphoria:beginner-journey' },
  ),
)
