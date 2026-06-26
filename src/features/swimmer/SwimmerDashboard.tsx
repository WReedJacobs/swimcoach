import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Target } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatTile } from '@/components/ui/StatTile'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SessionBlocks } from '@/components/SessionBlocks'
import { TimesChart } from '@/components/charts/TimesChart'
import { useMySwimmer, useAssignedSessions } from '@/hooks/useMySwimmer'
import { useTimes } from '@/hooks/useTimes'
import { fastestByEvent } from '@/lib/pbDetector'

export function SwimmerDashboard() {
  const { data: swimmer } = useMySwimmer()
  const { data: sessions } = useAssignedSessions(swimmer?.id)
  const { data: times } = useTimes(swimmer?.id)

  const today = new Date().toISOString().slice(0, 10)
  const todaySession = (sessions ?? []).find((s) => s.date === today) ?? null

  const pbCount = useMemo(() => fastestByEvent(times ?? []).size, [times])

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader kicker="Overview" />
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Times logged" value={times?.length ?? 0} />
          <StatTile label="Personal bests" value={pbCount} accent />
          <StatTile label="Sessions assigned" value={sessions?.length ?? 0} />
        </div>
      </div>

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
            <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No session today" description="Enjoy the rest, or log a swim of your own." />
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
