import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Lock,
  MapPin,
  DoorOpen,
  Wind,
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
  BookOpen,
} from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { ProgressBar, ProgressRing } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { GraduationModal } from './GraduationModal'
import { shoreWave } from '@/hooks/useWaterClick'
import { useBeginnerLogs, useBeginnerGoal } from './beginnerStore'
import { useJourneyStore } from '@/store/beginnerJourneyStore'
import { JOURNEY_STAGES, ALL_STEP_IDS, type JourneyStep } from './journeySteps'
import { cn } from '@/lib/cn'
import type { LucideIcon } from 'lucide-react'

// ─── Icon map ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  MapPin,
  DoorOpen,
  Wind,
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
    markStep,
  } = useJourneyStore()

  const [logs] = useBeginnerLogs()
  const [weeklyGoalM, setWeeklyGoalM] = useBeginnerGoal()

  // Previously the *only* way to open GraduationModal was completing all 12
  // steps (allDone && !graduationPromptSeen) — no manual "I'm ready now" or
  // "skip ahead" path existed independent of that. This makes the modal
  // openable on demand too; dismissing it (either path) always sets
  // graduationPromptSeen via onClose, which resets this back to false.
  const [forceOpen, setForceOpen] = useState(false)

  const totalSteps = ALL_STEP_IDS.length
  const doneCount = completedSteps.length
  const overallPct = Math.round((doneCount / totalSteps) * 100)
  const allDone = isAllComplete()
  const graduationOpen = (allDone && !graduationPromptSeen) || forceOpen

  // Shoreline wave (rare, celebratory) on each stage's false→true completion
  // transition — not on every render while a stage is already done.
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const wasStageDone = useRef<Record<string, boolean>>({})
  useEffect(() => {
    for (const stage of JOURNEY_STAGES) {
      const done = isStageComplete(stage.id)
      if (done && !wasStageDone.current[stage.id]) {
        const el = stageRefs.current[stage.id]
        if (el) shoreWave(el)
      }
      wasStageDone.current[stage.id] = done
    }
  }, [completedSteps, isStageComplete])

  const distanceThisWeek = useMemo(() => {
    const weekStart = new Date()
    const day = (weekStart.getDay() + 6) % 7
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - day)
    return logs
      .filter((l) => new Date(l.date) >= weekStart)
      .reduce((sum, l) => sum + l.distance, 0)
  }, [logs])

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="My Journey"
        action={
          <button
            type="button"
            onClick={() => setForceOpen(true)}
            className="text-xs font-medium text-text-muted transition-colors hover:text-coral"
          >
            Skip beginner mode →
          </button>
        }
      />

      {/* Persistent nudge once they've seen (and dismissed) the graduation
          prompt at least once — otherwise there's no way back to it short of
          re-completing every step (it only auto-opens once). */}
      {graduationPromptSeen && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-secondary/30 bg-secondary/5 px-4 py-3">
          <p className="text-sm font-medium text-text-primary">
            Ready to level up? You can become a Swimmer any time.
          </p>
          <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />} onClick={() => setForceOpen(true)}>
            Become a Swimmer
          </Button>
        </div>
      )}

      {/* Start-here prompt — only when brand new */}
      {logs.length === 0 && doneCount === 0 && (
        <div className="flex items-start gap-3 rounded-card border border-primary/20 bg-primary/5 px-4 py-3">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary">New here? Start with the Pool Guide.</p>
            <p className="mt-0.5 text-xs text-text-secondary">
              It covers lane etiquette, equipment, and what to expect in your first session.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                to="/beginner/learn/pool-guide"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Pool Guide <ArrowRight className="h-3 w-3" />
              </Link>
              <span className="text-xs text-text-muted">·</span>
              <Link
                to="/beginner/log"
                className="inline-flex items-center gap-1 text-xs font-medium text-coral hover:underline"
              >
                Log your first swim <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

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
          <div
            key={stage.id}
            ref={(el) => { stageRefs.current[stage.id] = el }}
            className="relative space-y-3"
          >
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

            {!prevStagesDone && (
              <p className="pl-10 text-sm text-text-muted">
                Complete {JOURNEY_STAGES[stageIdx - 1]?.label} first to unlock this stage.
              </p>
            )}

            {prevStagesDone && (
              <div className="space-y-2 pl-10">
                {stage.steps.map((step) => {
                  const done = hasCompleted(step.id)
                  const isCurrent = step.id === currentStepId
                  const status: 'done' | 'current' | 'locked' = done
                    ? 'done'
                    : isCurrent
                      ? 'current'
                      : 'locked'
                  return <StepCard key={step.id} step={step} status={status} />
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Weekly progress */}
      <div>
        <SectionHeader kicker="This week" />
        <Card>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-text-secondary">Log your first swim to start tracking your weekly distance.</p>
              <Link to="/beginner/log">
                <Button accent="coral" size="sm">Log a swim</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <ProgressRing
                value={distanceThisWeek}
                max={weeklyGoalM}
                label={`${distanceThisWeek}m`}
                sublabel={`of ${weeklyGoalM}m`}
              />
              <div className="flex flex-col justify-center gap-2">
                <CardHeader title="Weekly distance" subtitle="Update your goal any time" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-muted">Goal (metres)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={weeklyGoalM}
                    onChange={(e) => {
                      setWeeklyGoalM(Number(e.target.value))
                      markStep('set_goal')
                    }}
                    className="no-spin w-24 rounded-component border border-border bg-surface px-2 py-1 text-center font-mono text-sm text-text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

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
            'Follow the structured 8-week fitness programme',
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

      <GraduationModal open={graduationOpen} onClose={() => setForceOpen(false)} />
    </div>
  )
}
