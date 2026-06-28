import { useEffect } from 'react'
import { X, Lightbulb } from 'lucide-react'
import { useJourneyStore } from '@/store/beginnerJourneyStore'

interface BeginnerTipProps {
  stepId: string
  tip: string
  /** If true, visiting the page auto-marks the step without needing explicit dismiss */
  autoMark?: boolean
}

export function BeginnerTip({ stepId, tip, autoMark = false }: BeginnerTipProps) {
  const { hasCompleted, markStep } = useJourneyStore()
  const done = hasCompleted(stepId)

  useEffect(() => {
    if (autoMark && !done) markStep(stepId)
  }, [autoMark, done, markStep, stepId])

  if (done) return null

  return (
    <div className="mb-6 flex items-start gap-3 rounded-card border border-primary/20 bg-primary/5 p-4">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="flex-1 text-sm text-text-secondary">{tip}</p>
      <button
        onClick={() => markStep(stepId)}
        className="shrink-0 rounded-component p-1 text-text-muted transition-colors hover:bg-primary/10 hover:text-primary"
        title="Got it"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
