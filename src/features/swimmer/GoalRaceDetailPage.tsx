import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, RefreshCw, CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { StatTile } from '@/components/ui/StatTile'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { RaceWeekChecklistCard } from '@/components/RaceWeekChecklistCard'
import { useAuth } from '@/hooks/useAuth'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import {
  useGoalRace,
  useGoalRaceSessions,
  useGenerateTrainingPlan,
  useConfirmPlan,
  useDeleteGoalRace,
} from '@/hooks/useGoalRaces'
import { computeTrainingPlanSkeleton } from '@/lib/trainingPlanPhases'
import { localDateStr } from '@/lib/dateLocal'
import { formatTime } from '@/lib/formatTime'
import { GOAL_EVENT_TYPE_LABELS, PLAN_PHASE_LABELS } from '@/types'
import type { PlanPhase, Session } from '@/types'

const phaseTone: Record<PlanPhase, 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'coral'> = {
  prep: 'gray',
  base: 'blue',
  build: 'coral',
  peak: 'amber',
  taper: 'green',
}

export function GoalRaceDetailPage() {
  const { goalRaceId } = useParams<{ goalRaceId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: swimmer } = useMySwimmer()
  const { data: race, isLoading: raceLoading } = useGoalRace(goalRaceId)
  const { data: sessions, isLoading: sessionsLoading } = useGoalRaceSessions(goalRaceId)
  const generate = useGenerateTrainingPlan()
  const confirmPlan = useConfirmPlan()
  const deleteGoalRace = useDeleteGoalRace()
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [regeneratingWeek, setRegeneratingWeek] = useState<number | null>(null)

  const isSelfCoached = Boolean(swimmer && user && swimmer.coach_id === user.id)

  const skeleton = useMemo(
    () => (race ? computeTrainingPlanSkeleton(localDateStr(), race.race_date, race.event_type) : null),
    [race],
  )

  // Date.now() is flagged as impure during render regardless of useMemo
  // wrapping — a useState lazy initializer is the idiomatic way to seed a
  // one-time impure read (see GoalRacePage.tsx for the same pattern).
  const [now] = useState(() => Date.now())
  const daysOut = race ? Math.ceil((new Date(`${race.race_date}T00:00:00`).getTime() - now) / 86_400_000) : null

  const weekGroups = useMemo(() => {
    const map = new Map<number, Session[]>()
    for (const s of sessions ?? []) {
      if (s.plan_week_number == null) continue
      if (!map.has(s.plan_week_number)) map.set(s.plan_week_number, [])
      map.get(s.plan_week_number)!.push(s)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [sessions])

  const currentPhase = useMemo((): PlanPhase | null => {
    if (sessions && sessions.length > 0) {
      const today = localDateStr()
      const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))
      const pastOrToday = sorted.filter((s) => s.date <= today)
      const relevant = pastOrToday[pastOrToday.length - 1] ?? sorted[0]
      return relevant?.plan_phase ?? null
    }
    return skeleton?.weeks[0]?.phase ?? null
  }, [sessions, skeleton])

  const hasDrafts = (sessions ?? []).some((s) => s.plan_status === 'draft')
  const hasAnyPlan = (sessions ?? []).length > 0

  const editHref = (sessionId: string) =>
    isSelfCoached ? `/swimmer/sessions/${sessionId}/edit` : null

  if (raceLoading || !race) {
    return (
      <div className="space-y-8">
        <SectionHeader kicker="Goal Race" />
        <p className="text-sm text-text-muted">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <button
        onClick={() => navigate('/swimmer/goal-race')}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to goal races
      </button>

      <SectionHeader
        kicker={race.name}
        action={
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="flex items-center gap-1 rounded p-1 text-text-muted hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger/40"
            aria-label="Delete goal race"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Race"
          value={new Date(`${race.race_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          hint={`${race.distance_meters}m ${GOAL_EVENT_TYPE_LABELS[race.event_type]}`}
        />
        <StatTile
          label="Weeks to go"
          value={daysOut != null ? Math.max(0, Math.ceil(daysOut / 7)) : '—'}
          unit="wk"
          accent
          hint={daysOut != null ? `${daysOut} days out` : undefined}
        />
        <StatTile
          label="Current phase"
          value={currentPhase ? PLAN_PHASE_LABELS[currentPhase] : '—'}
        />
        <StatTile
          label="Target time"
          value={race.target_time_seconds ? formatTime(race.target_time_seconds) : '—'}
        />
      </div>

      {currentPhase === 'taper' && <RaceWeekChecklistCard daysToRace={daysOut ?? 0} />}

      {!hasAnyPlan && (
        <Card>
          <CardHeader
            title="Generate your plan"
            subtitle={
              skeleton
                ? `${skeleton.totalWeeks} weeks total — ${skeleton.taperWeeks} week${skeleton.taperWeeks === 1 ? '' : 's'} of taper (${skeleton.taperDays.min}-${skeleton.taperDays.max} days), volume reduced ${skeleton.volumeReductionPct.min}-${skeleton.volumeReductionPct.max}% while intensity stays up.`
                : undefined
            }
          />
          {generate.isError && (
            <p className="mb-3 text-sm text-danger">{generate.error instanceof Error ? generate.error.message : 'Generation failed.'}</p>
          )}
          <Button
            leftIcon={<Sparkles className="h-4 w-4" />}
            loading={generate.isPending}
            disabled={!skeleton || skeleton.totalWeeks < 1}
            onClick={() => goalRaceId && generate.mutate({ goalRaceId })}
          >
            Generate plan
          </Button>
          {skeleton && skeleton.totalWeeks < 1 && (
            <p className="mt-2 text-xs text-danger">This race date has already passed.</p>
          )}
        </Card>
      )}

      {hasAnyPlan && (
        <div>
          <SectionHeader
            kicker="Plan preview"
            action={
              hasDrafts ? (
                <Button
                  size="sm"
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  loading={confirmPlan.isPending}
                  onClick={() => goalRaceId && confirmPlan.mutate(goalRaceId)}
                >
                  Confirm plan
                </Button>
              ) : (
                <Badge tone="green">Confirmed</Badge>
              )
            }
          />
          <div className="space-y-3">
            {weekGroups.map(([weekNumber, weekSessions]) => {
              const phase = weekSessions[0]?.plan_phase ?? null
              const isDraft = weekSessions[0]?.plan_status === 'draft'
              return (
                <Card key={weekNumber}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-text-primary">Week {weekNumber}</span>
                      {phase && <Badge tone={phaseTone[phase]}>{PLAN_PHASE_LABELS[phase]}</Badge>}
                      {isDraft && <Badge tone="gray">Draft</Badge>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      loading={generate.isPending && regeneratingWeek === weekNumber}
                      onClick={() => {
                        if (!goalRaceId) return
                        setRegeneratingWeek(weekNumber)
                        generate.mutate(
                          { goalRaceId, weekNumber },
                          { onSettled: () => setRegeneratingWeek(null) },
                        )
                      }}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <ul className="space-y-1.5">
                    {weekSessions
                      .slice()
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map((s) => {
                        const href = editHref(s.id)
                        return (
                          <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-text-secondary">
                              <span className="font-mono text-xs tabular-nums text-text-muted">
                                {new Date(`${s.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                              </span>{' '}
                              — {s.title}
                            </span>
                            {href && (
                              <Link to={href} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                                <Pencil className="h-3 w-3" /> Edit
                              </Link>
                            )}
                          </li>
                        )
                      })}
                  </ul>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {sessionsLoading && <p className="text-sm text-text-muted">Loading plan…</p>}

      <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)} title="Delete this goal race?">
        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            This removes {race.name} and unlinks any generated sessions (the sessions themselves stay, editable as
            ordinary sessions).
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              loading={deleteGoalRace.isPending}
              onClick={async () => {
                if (!goalRaceId || !swimmer) return
                await deleteGoalRace.mutateAsync({ id: goalRaceId, swimmerId: swimmer.id })
                navigate('/swimmer/goal-race')
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
