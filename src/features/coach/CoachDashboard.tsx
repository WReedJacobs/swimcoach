import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, Trophy, Timer, ArrowRight, Plus, Copy, Medal, CheckCircle2, Circle, X } from 'lucide-react'
import { StatTile } from '@/components/ui/StatTile'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LevelBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCards } from '@/components/ui/Skeleton'
import { LoadFlagBadge } from '@/components/ui/LoadFlagBadge'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useSessions, useTodaySession } from '@/hooks/useSessions'
import { useTimes } from '@/hooks/useTimes'
import { useGoalsForSwimmers } from '@/hooks/useGoals'
import { useUnreadCount } from '@/hooks/useMessages'
import { useAuth } from '@/hooks/useAuth'
import { useSquadLeaderboard } from '@/hooks/useSwimmerStats'
import { fastestByEvent } from '@/lib/pbDetector'
import { formatTime } from '@/lib/formatTime'
import { swimmerName } from '@/types'

const SETUP_DISMISSED_KEY = 'sc_coach_setup_dismissed'

function CoachSetupCard({
  hasSwimmers,
  hasSessions,
  hasTimes,
}: {
  hasSwimmers: boolean
  hasSessions: boolean
  hasTimes: boolean
}) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(SETUP_DISMISSED_KEY) === 'true',
  )

  const steps = [
    { label: 'Add your first swimmer', done: hasSwimmers, href: '/coach/roster' },
    { label: 'Build a session', done: hasSessions, href: '/coach/sessions/new' },
    { label: 'Log a time for a swimmer', done: hasTimes, href: '/coach/log' },
    { label: 'Leave a feedback note', done: false, href: '/coach/feedback' },
  ]

  const doneCount = steps.filter((s) => s.done).length

  if (dismissed) return null

  return (
    <Card className="border-primary/20 bg-primary/5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-text-primary">Get set up</p>
          <p className="text-sm text-text-secondary">
            {doneCount} of {steps.length} steps complete
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(SETUP_DISMISSED_KEY, 'true')
            setDismissed(true)
          }}
          aria-label="Dismiss setup card"
          className="text-text-muted hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ul className="space-y-2">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-text-muted" />
            )}
            {step.done ? (
              <span className="text-sm line-through text-text-muted">{step.label}</span>
            ) : (
              <Link to={step.href} className="text-sm text-primary hover:underline">
                {step.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </Card>
  )
}

function startOfWeek(): Date {
  const d = new Date()
  const day = (d.getDay() + 6) % 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

export function CoachDashboard() {
  const { profile } = useAuth()
  const { data: swimmers, isLoading: loadingSwimmers } = useSwimmers()
  const { data: sessions } = useSessions()
  const { todaySession } = useTodaySession()
  const { data: times } = useTimes()
  const { data: unread } = useUnreadCount()

  const swimmerIds = useMemo(() => (swimmers ?? []).map((s) => s.id), [swimmers])
  const { data: goals } = useGoalsForSwimmers(swimmerIds)

  const stats = useMemo(() => {
    const weekStart = startOfWeek()
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const sessionsThisWeek = (sessions ?? []).filter(
      (s) => new Date(s.date) >= weekStart,
    ).length
    const pbsThisMonth = (times ?? []).filter(
      (t) => t.is_pb && new Date(t.recorded_at) >= monthStart,
    ).length

    return {
      activeSwimmers: swimmers?.length ?? 0,
      sessionsThisWeek,
      pbsThisMonth,
      unread: unread ?? 0,
    }
  }, [swimmers, sessions, times, unread])

  const progressRows = useMemo(() => {
    if (!swimmers || !times || !goals) return []
    return swimmers
      .map((sw) => {
        const swTimes = times.filter((t) => t.swimmer_id === sw.id)
        const goal = goals.find((g) => g.swimmer_id === sw.id && !g.achieved)
        if (!goal) return null
        const bestMap = fastestByEvent(swTimes)
        const best = [...bestMap.values()]
          .filter((t) => t.stroke === goal.stroke && t.distance === goal.distance)
          .sort((a, b) => a.time_seconds - b.time_seconds)[0]
        if (!best) return null
        const pct = Math.min(100, (goal.target_time_seconds / best.time_seconds) * 100)
        return { sw, goal, best, pct }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .slice(0, 4)
  }, [swimmers, times, goals])

  const recent = useMemo(() => (swimmers ?? []).slice(-5).reverse(), [swimmers])
  const { data: squadLeaderboard = [] } = useSquadLeaderboard(profile?.id ?? null)

  // Show focused onboarding when the coach has no swimmers yet
  if (!loadingSwimmers && swimmers?.length === 0) {
    return (
      <div className="space-y-8">
        <SectionHeader kicker="Overview" />
        <Card className="py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Users className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary">Welcome to Swimphoria</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
            Add your first swimmer to get started. Share your join code and they can connect instantly.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            {profile?.join_code && (
              <div className="flex items-center gap-3 rounded-component border border-border bg-bg px-4 py-2">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">Your join code</span>
                <span className="font-mono text-xl font-bold tracking-[0.2em] text-primary">{profile.join_code}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(profile.join_code!)}
                  className="text-text-muted hover:text-primary"
                  title="Copy join code"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            )}
            <Link to="/coach/roster">
              <Button leftIcon={<Plus className="h-4 w-4" />}>Add swimmer manually</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Setup card — dismissible, shows until all key actions done */}
      <CoachSetupCard
        hasSwimmers={(swimmers?.length ?? 0) > 0}
        hasSessions={(sessions?.length ?? 0) > 0}
        hasTimes={(times?.length ?? 0) > 0}
      />

      {/* Stat tiles */}
      <div>
        <SectionHeader kicker="Overview" />
        {loadingSwimmers ? (
          <SkeletonCards />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Active swimmers" value={stats.activeSwimmers} />
            <StatTile label="Sessions this week" value={stats.sessionsThisWeek} />
            <StatTile label="PBs this month" value={stats.pbsThisMonth} accent />
            <StatTile label="Unread messages" value={stats.unread} />
          </div>
        )}
      </div>

      <div>
      <SectionHeader kicker="Today" />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Today's session */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Today's session"
            action={
              <Link to="/coach/sessions">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            }
          />
          {todaySession ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-text-primary">{todaySession.title}</p>
                <p className="text-sm capitalize text-text-secondary">{todaySession.type}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Warm-up', todaySession.warm_up],
                  ['Main set', todaySession.main_set],
                  ['Cool-down', todaySession.cool_down],
                ].map(([label, body]) => (
                  <div key={label} className="rounded-component bg-bg p-3">
                    <p className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-text-muted">{label}</p>
                    <p className="mt-1 text-sm text-text-primary">{body || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No session scheduled today"
              description="Build a session and assign it to your squad."
              action={
                <Link to="/coach/sessions/new">
                  <Button leftIcon={<Plus className="h-4 w-4" />}>New session</Button>
                </Link>
              }
            />
          )}
        </Card>

        {/* Quick action: log times */}
        <Card className="flex flex-col justify-between">
          <CardHeader title="Quick log" subtitle="Time a swim right now" />
          <Link to="/coach/log">
            <Button className="w-full" size="lg" leftIcon={<Timer className="h-5 w-5" />}>
              Open time logger
            </Button>
          </Link>
        </Card>
      </div>
      </div>

      {squadLeaderboard.length > 0 && (
        <div>
          <SectionHeader
            kicker="Squad Ratings"
            action={
              <Link to="/coach/leaderboard">
                <Button variant="ghost" size="sm" leftIcon={<Medal className="h-3.5 w-3.5" />}>
                  Full leaderboard
                </Button>
              </Link>
            }
          />
          <Card>
            <CardHeader title="Top swimmers by OVR" />
            <ul className="space-y-2">
              {squadLeaderboard.slice(0, 3).map((entry, i) => (
                <li key={entry.user_id} className="flex items-center gap-3">
                  <span className="w-5 text-center font-mono text-sm font-bold text-text-muted">
                    {i + 1}
                  </span>
                  <Avatar name={entry.profile?.full_name ?? '?'} size="sm" />
                  <span className="flex-1 truncate text-sm font-medium text-text-primary">
                    {entry.profile?.full_name ?? 'Swimmer'}
                  </span>
                  <span className="font-mono text-sm font-black tabular-nums text-text-primary">
                    {entry.ovr}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-text-muted capitalize">
                    {entry.tier}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <div>
      <SectionHeader kicker="Squad" />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Roster quick-view */}
        <Card>
          <CardHeader
            title="Recent swimmers"
            action={
              <Link to="/coach/roster" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Roster <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No swimmers yet"
              description="Add your first swimmer to get started."
              action={
                <Link to="/coach/roster">
                  <Button leftIcon={<Plus className="h-4 w-4" />}>Add swimmer</Button>
                </Link>
              }
            />
          ) : (
            <ul className="-mx-2">
              {recent.map((sw) => (
                <li key={sw.id}>
                  <Link
                    to={`/coach/roster/${sw.id}`}
                    className="flex items-center gap-3 rounded-component px-2 py-2.5 transition-all hover:bg-primary/[0.07] hover:shadow-[inset_2px_0_0_rgb(var(--c-primary))]"
                  >
                    <Avatar name={swimmerName(sw)} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{swimmerName(sw)}</p>
                      <p className="truncate text-xs text-text-muted">{sw.squad || 'No squad'}</p>
                    </div>
                    <LoadFlagBadge swimmerId={sw.id} />
                    <LevelBadge level={sw.level} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Progress vs goals */}
        <Card>
          <CardHeader title="Goal progress" subtitle="Top swimmers vs their targets" />
          {progressRows.length === 0 ? (
            <EmptyState
              icon={<Trophy className="h-6 w-6" />}
              title="No goals tracked yet"
              description="Set goals for your swimmers to see progress here."
            />
          ) : (
            <div className="space-y-4">
              {progressRows.map(({ sw, goal, best, pct }) => (
                <div key={sw.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-text-primary">{swimmerName(sw)}</span>
                    <span className="font-mono tabular-nums text-text-secondary">
                      {best.distance}m {goal.stroke} · {formatTime(best.time_seconds)} / {formatTime(goal.target_time_seconds)}
                    </span>
                  </div>
                  <ProgressBar value={pct} tone={pct >= 100 ? 'green' : 'blue'} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
      </div>
    </div>
  )
}
