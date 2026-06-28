import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Lock,
  MapPin,
  Gauge,
  Library,
  Plus,
  Target,
  PlayCircle,
  CalendarCheck,
  Timer,
  Award,
  Star,
  ArrowRight,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { GraduationModal } from './GraduationModal'
import { useJourneyStore } from '@/store/beginnerJourneyStore'
import { JOURNEY_STAGES, ALL_STEP_IDS, type JourneyStep } from './journeySteps'
import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

// ─── Icon map ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  MapPin,
  Gauge,
  Library,
  Plus,
  Target,
  PlayCircle,
  CalendarCheck,
  Timer,
  Award,
  Star,
}

// ─── Step card ─────────────────────────────────────────────────────────────

function StepCard({
  step,
  status,
}: {
  step: JourneyStep
  status: 'done' | 'current' | 'locked'
}) {
  const Icon = ICON_MAP[step.icon] ?? Target

  return (
    <div
      className={cn(
        'flex items-start gap-4 rounded-card border p-4 transition-all',
        status === 'done' && 'border-border bg-bg opacity-70',
        status === 'current' && 'border-border bg-surface border-l-2 border-l-primary',
        status === 'locked' && 'border-border bg-bg opacity-40',
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-component',
          status === 'done' && 'bg-secondary/10 text-secondary',
          status === 'current' && 'bg-primary/10 text-primary',
          status === 'locked' && 'bg-border text-text-muted',
        )}
      >
        {status === 'done' ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : status === 'locked' ? (
          <Lock className="h-4 w-4" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-medium',
            status === 'done' && 'line-through text-text-muted',
            status === 'current' && 'text-text-primary',
            status === 'locked' && 'text-text-muted',
          )}
        >
          {step.label}
        </p>
        <p className="mt-0.5 text-sm text-text-muted">{step.description}</p>
      </div>

      {/* CTA */}
      {status === 'current' && (
        <Link to={step.href} className="shrink-0">
          <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Do this now
          </Button>
        </Link>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export function JourneyPage() {
  const {
    completedSteps,
    currentStage,
    graduationPromptSeen,
    isStageComplete,
    isAllComplete,
    currentStepInStage,
    hasCompleted,
  } = useJourneyStore()

  const totalSteps = ALL_STEP_IDS.length
  const doneCount = completedSteps.length
  const overallPct = Math.round((doneCount / totalSteps) * 100)
  const allDone = isAllComplete()

  return (
    <div className="space-y-8">
      <SectionHeader kicker="My Journey" />

      {/* Progress header */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-text-primary capitalize">{currentStage}</p>
            <p className="text-sm text-text-secondary">
              {JOURNEY_STAGES.find((s) => s.id === currentStage)?.description}
            </p>
          </div>
          <span className="font-mono text-sm tabular-nums text-text-muted">
            {doneCount} of {totalSteps} steps
          </span>
        </div>

        {/* Segmented progress bar */}
        <div className="flex gap-1.5">
          {JOURNEY_STAGES.map((stage) => {
            const stageSteps = stage.steps.length
            const stageDone = stage.steps.filter((st) => hasCompleted(st.id)).length
            const pct = (stageDone / stageSteps) * 100
            return (
              <div key={stage.id} className="flex-1 space-y-1">
                <ProgressBar
                  value={pct}
                  max={100}
                  tone={isStageComplete(stage.id) ? 'green' : 'blue'}
                />
                <p className="font-mono text-[9px] uppercase tracking-wider text-text-muted">
                  {stage.label}
                </p>
              </div>
            )
          })}
        </div>

        {overallPct > 0 && (
          <p className="mt-2 font-mono text-xs text-text-muted">{overallPct}% complete</p>
        )}
      </Card>

      {/* Stage sections */}
      {JOURNEY_STAGES.map((stage, stageIdx) => {
        const prevStagesDone =
          stageIdx === 0 ||
          JOURNEY_STAGES.slice(0, stageIdx).every((s) => isStageComplete(s.id))
        const stageDone = isStageComplete(stage.id)
        const isActive = stage.id === currentStage
        const currentStepId = isActive ? currentStepInStage(stage.id) : null

        return (
          <div key={stage.id} className="space-y-3">
            {/* Stage header */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold',
                  stageDone
                    ? 'bg-secondary/10 text-secondary'
                    : isActive
                      ? 'bg-primary/10 text-primary'
                      : 'bg-border text-text-muted',
                )}
              >
                {stageIdx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2
                    className={cn(
                      'font-semibold',
                      stageDone || isActive ? 'text-text-primary' : 'text-text-muted',
                    )}
                  >
                    {stage.label}
                  </h2>
                  {stageDone && (
                    <CheckCircle2 className="h-4 w-4 text-secondary" />
                  )}
                  {!prevStagesDone && (
                    <Lock className="h-3.5 w-3.5 text-text-muted" />
                  )}
                </div>
                <p className="text-sm text-text-muted">{stage.description}</p>
              </div>
            </div>

            {/* Locked notice */}
            {!prevStagesDone && (
              <p className="pl-10 text-sm text-text-muted">
                Complete {JOURNEY_STAGES[stageIdx - 1]?.label} first to unlock this stage.
              </p>
            )}

            {/* Steps */}
            {prevStagesDone && (
              <div className="space-y-2 pl-10">
                {stage.steps.map((step) => {
                  const done = hasCompleted(step.id)
                  const isCurrent = step.id === currentStepId
                  const status: 'done' | 'current' | 'locked' = done
                    ? 'done'
                    : isCurrent
                      ? 'current'
                      : stageDone || isActive
                        ? 'locked'
                        : 'locked'
                  return <StepCard key={step.id} step={step} status={status} />
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Coach-free CTA */}
      <Card className="border-coral/20 bg-coral/5">
        <CardHeader
          title="No coach? No problem."
          subtitle="The full swimmer experience works completely solo."
        />
        <ul className="mb-4 space-y-2">
          {[
            'Log times and track your personal bests',
            'Set event goals and watch your progress',
            'Follow the structured 4-week fitness program',
          ].map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
              {t}
            </li>
          ))}
        </ul>
        <Link to="/beginner/find-coach">
          <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
            Find a coach when you're ready
          </Button>
        </Link>
      </Card>

      {/* Graduation modal */}
      <GraduationModal open={allDone && !graduationPromptSeen} />
    </div>
  )
}
