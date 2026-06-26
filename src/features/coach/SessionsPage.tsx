import { Link } from 'react-router-dom'
import { Plus, CalendarDays } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRows } from '@/components/ui/Skeleton'
import { useSessions } from '@/hooks/useSessions'
import type { SessionType } from '@/types'

const typeTone: Record<SessionType, 'blue' | 'amber' | 'green'> = {
  training: 'blue',
  race: 'amber',
  dryland: 'green',
}

export function SessionsPage() {
  const { data: sessions, isLoading } = useSessions()
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="Sessions"
        action={
          <Link to="/coach/sessions/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>New session</Button>
          </Link>
        }
      />

      {isLoading ? (
        <SkeletonRows count={4} />
      ) : (sessions ?? []).length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="No sessions yet"
          description="Build your first training session and assign it to swimmers."
          action={
            <Link to="/coach/sessions/new">
              <Button leftIcon={<Plus className="h-4 w-4" />}>New session</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {(sessions ?? []).map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{s.title}</h3>
                    <Badge tone={typeTone[s.type]} className="capitalize">{s.type}</Badge>
                    {s.date === today && <Badge tone="green">Today</Badge>}
                  </div>
                  <p className="mt-0.5 font-mono text-sm tabular-nums text-text-secondary">
                    {new Date(s.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  {s.main_set && (
                    <p className="mt-2 text-sm text-text-primary">
                      <span className="font-medium">Main:</span> {s.main_set}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
