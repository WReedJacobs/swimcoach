import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Target, UserPlus, ArrowRight, Pin } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SessionBlocks } from '@/components/SessionBlocks'
import { TimesChart } from '@/components/charts/TimesChart'
import { useMySwimmer, useAssignedSessions } from '@/hooks/useMySwimmer'
import { useTimes } from '@/hooks/useTimes'
import { useFeedback } from '@/hooks/useFeedback'
import { useStreak } from '@/hooks/useStreak'
import { useJoinCoach } from '@/hooks/useJoinCode'
import { useAuth } from '@/hooks/useAuth'
import { useOnboardingDraft } from '@/features/onboarding/onboardingStore'
import { fastestByEvent } from '@/lib/pbDetector'
import { cn } from '@/lib/cn'

function startOfWeek(): Date {
  const d = new Date()
  const day = (d.getDay() + 6) % 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - day)
  return d
}

function JoinCoachCard() {
  const { mutateAsync: joinCoach } = useJoinCoach()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (code.length !== 6) return
    setLoading(true)
    setError(null)
    try {
      const result = await joinCoach(code)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="border-secondary/40 bg-secondary/5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">Connected to your coach</p>
            <p className="text-sm text-text-secondary">Sessions and feedback will appear here shortly.</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Connect to your coach"
        subtitle="Ask your coach for their 6-character join code. Once connected, your sessions and feedback will appear here."
      />
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <input
            type="text"
            maxLength={6}
            placeholder="ABC123"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
              setError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={cn(
              'w-full rounded-component border bg-surface px-3 py-2 font-mono text-xl font-bold uppercase tracking-[0.25em] text-text-primary placeholder:text-text-muted',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
              error ? 'border-danger focus:ring-danger/30' : 'border-border',
            )}
          />
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
        <Button
          leftIcon={<ArrowRight className="h-4 w-4" />}
          loading={loading}
          disabled={code.length !== 6}
          onClick={handleSubmit}
          className="mt-0.5"
        >
          Join
        </Button>
      </div>
    </Card>
  )
}

export function SwimmerDashboard() {
  const { profile } = useAuth()
  const { data: swimmer } = useMySwimmer()
  const { data: sessions } = useAssignedSessions(swimmer?.id)
  const { data: times } = useTimes(swimmer?.id)
  const { data: feedback } = useFeedback(swimmer?.id)
  const streak = useStreak(swimmer?.id)
  const [onboarding] = useOnboardingDraft()

  const today = new Date().toISOString().slice(0, 10)
  const todaySession = (sessions ?? []).find((s) => s.date === today) ?? null

  const pbCount = useMemo(() => fastestByEvent(times ?? []).size, [times])

  const weeklyVolume = useMemo(() => {
    const weekStart = startOfWeek()
    return (times ?? [])
      .filter((t) => new Date(t.recorded_at) >= weekStart)
      .reduce((sum, t) => sum + t.distance, 0)
  }, [times])

  const pinnedFeedback = useMemo(() => (feedback ?? []).filter((f) => f.is_pinned), [feedback])

  const hasRealCoach =
    profile?.coach_id !== null && profile?.coach_id !== profile?.id

  return (
    <div className="space-y-8">
      {!hasRealCoach && (
        <div>
          <SectionHeader kicker="Get started" />
          <JoinCoachCard />
        </div>
      )}

      <div>
        <SectionHeader kicker="Overview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Times logged" value={times?.length ?? 0} />
          <StatTile label="Personal bests" value={pbCount} accent />
          <StatTile label="Day streak" value={streak} unit={streak === 1 ? 'day' : 'days'} />
          <StatTile
            label="This week"
            value={weeklyVolume}
            unit="m"
            hint={onboarding.weeklyGoalMeters ? `of ${onboarding.weeklyGoalMeters.toLocaleString()}m goal` : undefined}
          />
        </div>
      </div>

      {pinnedFeedback.length > 0 && (
        <div>
          <SectionHeader kicker="From your coach" />
          <div className="space-y-2">
            {pinnedFeedback.map((f) => (
              <Card key={f.id} className="border-accent/20 bg-accent/5">
                <div className="flex items-start gap-2">
                  <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary">{f.content}</p>
                    <p className="mt-1 font-mono text-xs tabular-nums text-text-muted">
                      {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHeader kicker="Today" />
        <Card>
          <CardHeader
            title="Today's session"
            action={
              <Link to="/swimmer/today">
                <Button variant="ghost" size="sm">Details</Button>
              </Link>
            }
          />
          {todaySession ? (
            <div className="space-y-3">
              <p className="text-lg font-semibold text-text-primary">{todaySession.title}</p>
              <SessionBlocks session={todaySession} />
            </div>
          ) : (
            <EmptyState
              icon={<CalendarDays className="h-6 w-6" />}
              title="No session today"
              description="Enjoy the rest, or log a swim of your own."
            />
          )}
        </Card>
      </div>

      <div>
        <SectionHeader kicker="Progress" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader title="Your progress" />
            <TimesChart times={times ?? []} />
          </Card>
          <Card className="flex flex-col justify-between">
            <CardHeader title="Set a goal" subtitle="Give yourself a target to chase" />
            <Link to="/swimmer/goals">
              <Button className="w-full" leftIcon={<Target className="h-4 w-4" />}>
                Manage goals
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
