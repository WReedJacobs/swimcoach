import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, CalendarDays, Trophy, Timer, ArrowRight, Plus } from 'lucide-react'
import { StatTile } from '@/components/ui/StatTile'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LevelBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonCards } from '@/components/ui/Skeleton'
import { useSwimmers } from '@/hooks/useSwimmers'
import { useSessions, useTodaySession } from '@/hooks/useSessions'
import { useTimes } from '@/hooks/useTimes'
import { useGoalsForSwimmers } from '@/hooks/useGoals'
import { useUnreadCount } from '@/hooks/useMessages'
import { fastestByEvent } from '@/lib/pbDetector'
import { formatTime } from '@/lib/formatTime'
import { swimmerName } from '@/types'

function startOfWeek(): Date {
  const d = new Date()
  const day = (d.getDay() + 6) % 7 // Monday = 0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

export function CoachDashboard() {
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

  // Top 4 swimmers with a goal → progress toward target (lower time = better).
  const progressRows = useMemo(() => {
    if (!swimmers || !times || !goals) return []
    return swimmers
      .map((sw) => {
        const swTimes = times.filter((t) => t.swimmer_id === sw.id)
        const goal = goals.find((g) => g.swimmer_id === sw.id && !g.achieved)
        if (!goal) return null
        const best = fastestByEvent(swTimes).get(`${goal.stroke}-${goal.distance}`)
        if (!best) return null
        const pct = Math.min(100, (goal.target_time_seconds / best.time_seconds) * 100)
        return { sw, goal, best, pct }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .slice(0, 4)
  }, [swimmers, times, goals])

  const recent = useMemo(() => (swimmers ?? []).slice(-5).reverse(), [swimmers])

  return (
    <div className="space-y-8">
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
