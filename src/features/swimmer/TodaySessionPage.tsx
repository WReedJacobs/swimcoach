import { CalendarDays } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SessionBlocks } from '@/components/SessionBlocks'
import { useMySwimmer, useAssignedSessions } from '@/hooks/useMySwimmer'

export function TodaySessionPage() {
  const { data: swimmer } = useMySwimmer()
  const { data: sessions } = useAssignedSessions(swimmer?.id)
  const today = new Date().toISOString().slice(0, 10)
  const todaySession = (sessions ?? []).find((s) => s.date === today) ?? null
  const upcoming = (sessions ?? []).filter((s) => s.date > today).reverse()

  return (
    <div className="space-y-8">
      <div>
      <SectionHeader kicker="Today" />
      <Card>
        <CardHeader title="Today" />
        {todaySession ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-text-primary">{todaySession.title}</h3>
              <Badge tone="blue" className="capitalize">{todaySession.type}</Badge>
            </div>
            <SessionBlocks session={todaySession} />
            {todaySession.notes && (
              <p className="rounded-component bg-bg p-3 text-sm text-text-secondary">{todaySession.notes}</p>
            )}
          </div>
        ) : (
          <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No session scheduled today" />
        )}
      </Card>
      </div>

      {upcoming.length > 0 && (
        <div>
        <SectionHeader kicker="Coming up" />
        <Card>
          <CardHeader title="Coming up" />
          <ul className="space-y-2">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-component bg-bg p-3 text-sm">
                <span className="font-medium text-text-primary">{s.title}</span>
                <span className="font-mono tabular-nums text-text-secondary">{new Date(s.date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </Card>
        </div>
      )}
    </div>
  )
}
