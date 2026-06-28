import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Map } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { ProgressBar, ProgressRing } from '@/components/ui/ProgressBar'
import { SwimmerCard } from '@/components/ui/SwimmerCard'
import { GraduationModal } from './GraduationModal'
import { useBeginnerLogs, useBeginnerGoal } from './beginnerStore'
import { useJourneyStore } from '@/store/beginnerJourneyStore'
import { JOURNEY_STAGES, ALL_STEP_IDS } from './journeySteps'
import type { SwimmerStatsRow } from '@/hooks/useSwimmerStats'

const PLACEHOLDER_STATS: SwimmerStatsRow = {
  id: 'placeholder',
  user_id: 'placeholder',
  ovr: 30,
  prev_ovr: 30,
  spd: 20,
  end_stat: 20,
  tec: 20,
  con: 25,
  prg: 15,
  com: 25,
  tier: 'rookie',
  last_calculated: new Date().toISOString(),
  created_at: new Date().toISOString(),
}

export function BeginnerHome() {
  const [logs] = useBeginnerLogs()
  const [weeklyGoalM, setWeeklyGoalM] = useBeginnerGoal()
  const {
    completedSteps,
    currentStage,
    isAllComplete,
    graduationPromptSeen,
    currentStepInStage,
    hasCompleted,
    markStep,
  } = useJourneyStore()

  const allDone = isAllComplete()

  const distanceThisWeek = useMemo(() => {
    const weekStart = new Date()
    const day = (weekStart.getDay() + 6) % 7
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(weekStart.getDate() - day)
    return logs
      .filter((l) => new Date(l.date) >= weekStart)
      .reduce((sum, l) => sum + l.distance, 0)
  }, [logs])

  // Auto-mark set_goal when goal has been changed from default or goal exists
  // (goal always exists since it defaults to 1000 — only mark if user explicitly set it)

  const totalSteps = ALL_STEP_IDS.length
  const doneCount = completedSteps.length
  const overallPct = Math.round((doneCount / totalSteps) * 100)

  // Current stage steps — show first incomplete + next
  const currentStageDef = JOURNEY_STAGES.find((s) => s.id === currentStage)
  const currentStepId = currentStepInStage(currentStage)
  const currentStep = currentStageDef?.steps.find((s) => s.id === currentStepId)
  const stepsLeftInStage = (currentStageDef?.steps ?? []).filter(
    (s) => !hasCompleted(s.id),
  ).length

  // Persistent graduation banner (after seen graduation modal)
  const showGradBanner = allDone && graduationPromptSeen

  return (
    <div className="space-y-8">
      {/* Graduation banner (persistent after modal dismissed) */}
      {showGradBanner && (
        <div className="flex items-center justify-between gap-4 rounded-card border border-secondary/30 bg-secondary/5 px-4 py-3">
          <p className="text-sm font-medium text-text-primary">
            Ready to level up? You've completed all beginner steps.
          </p>
          <Link to="/beginner/journey">
            <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Create your Swimmer profile
            </Button>
          </Link>
        </div>
      )}

      {/* Journey progress card */}
      <div>
        <SectionHeader kicker="My Journey" />
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold capitalize text-text-primary">{currentStage}</span>
                {stepsLeftInStage > 0 && (
                  <span className="font-mono text-xs text-text-muted">
                    · {stepsLeftInStage} step{stepsLeftInStage !== 1 ? 's' : ''} left
                  </span>
                )}
              </div>
              {currentStep && (
                <p className="mt-1 text-sm text-text-secondary">
                  Next: <span className="font-medium text-text-primary">{currentStep.label}</span>
                </p>
              )}
              {allDone && (
                <p className="mt-1 text-sm font-medium text-secondary">
                  All steps complete — you're ready to graduate!
                </p>
              )}
            </div>
            <Link to="/beginner/journey" className="shrink-0">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Map className="h-3.5 w-3.5" />}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Full journey
              </Button>
            </Link>
          </div>

          <div className="mt-4 space-y-1.5">
            <ProgressBar value={overallPct} max={100} tone={allDone ? 'green' : 'blue'} />
            <p className="font-mono text-[11px] text-text-muted">
              {doneCount} of {totalSteps} steps complete
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly progress */}
      <div>
        <SectionHeader kicker="Progress" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="flex flex-col items-center justify-center lg:col-span-1">
            <CardHeader title="This week" />
            {logs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <p className="text-sm text-text-secondary">Log your first swim to start tracking</p>
                <Link to="/beginner/log">
                  <Button accent="coral" size="sm">Log a swim</Button>
                </Link>
              </div>
            ) : (
              <>
                <ProgressRing
                  value={distanceThisWeek}
                  max={weeklyGoalM}
                  label={`${distanceThisWeek}m`}
                  sublabel={`of ${weeklyGoalM}m goal`}
                />
                <div className="mt-4 flex items-center gap-2">
                  <label className="text-xs text-text-muted">Weekly goal (m)</label>
                  <input
                    type="number"
                    min={100}
                    step={100}
                    value={weeklyGoalM}
                    onChange={(e) => {
                      setWeeklyGoalM(Number(e.target.value))
                      markStep('set_goal')
                    }}
                    className="no-spin w-20 rounded-component border border-border bg-surface px-2 py-1 text-center font-mono text-sm text-text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </>
            )}
          </Card>

          {/* Locked swimmer card */}
          <Card className="lg:col-span-2">
            <CardHeader
              title="Your Swimmer Card"
              subtitle="Unlock the full rating system by graduating to Swimmer"
            />
            <div className="flex items-center gap-6">
              <SwimmerCard
                stats={PLACEHOLDER_STATS}
                name="You"
                size="md"
                locked
              />
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  Complete your journey to earn your OVR rating across 6 attributes — Speed,
                  Endurance, Technique, Consistency, Progress and Commitment.
                </p>
                <Link to="/beginner/journey">
                  <Button
                    size="sm"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Continue journey
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Graduation modal */}
      <GraduationModal open={allDone && !graduationPromptSeen} />
    </div>
  )
}
