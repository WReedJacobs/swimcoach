import { useEffect } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { MILESTONES, useMilestones, useBeginnerLogs } from './beginnerStore'

export function MilestonesPage() {
  const [milestones, setMilestones] = useMilestones()
  const [logs] = useBeginnerLogs()

  // Auto-achieve distance milestones when the user has logged a swim of that distance or more
  useEffect(() => {
    const maxLogged = logs.reduce((max, l) => Math.max(max, l.distance), 0)
    setMilestones((prev) =>
      prev.map((m) => {
        if (!m.achievedAt && m.distance <= maxLogged) {
          return { ...m, achievedAt: new Date().toISOString() }
        }
        return m
      }),
    )
  }, [logs, setMilestones])

  const toggle = (distance: number) => {
    setMilestones((prev) =>
      prev.map((m) =>
        m.distance === distance
          ? { ...m, achievedAt: m.achievedAt ? null : new Date().toISOString() }
          : m,
      ),
    )
  }

  const stateFor = (distance: number) =>
    milestones.find((m) => m.distance === distance)?.achievedAt ?? null

  const isFromLogs = (distance: number) =>
    logs.some((l) => l.distance >= distance)

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Milestones" />
    <Card>
      <CardHeader
        title="Milestones"
        subtitle="Distance milestones are detected automatically from your logs. Others you can mark yourself."
      />
      <ul className="space-y-2">
        {MILESTONES.map((m) => {
          const achievedAt = stateFor(m.distance)
          const done = Boolean(achievedAt)
          const fromLogs = done && isFromLogs(m.distance)
          return (
            <li key={m.distance}>
              <button
                onClick={() => toggle(m.distance)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-card border p-4 text-left transition-colors',
                  done ? 'border-coral/40 bg-coral/5' : 'border-border hover:bg-bg',
                )}
              >
                {done ? (
                  <CheckCircle2 className="h-6 w-6 text-coral" />
                ) : (
                  <Circle className="h-6 w-6 text-text-muted" />
                )}
                <div className="flex-1">
                  <p className={cn('font-medium', done ? 'text-coral' : 'text-text-primary')}>{m.label}</p>
                  {achievedAt && (
                    <p className="text-xs text-text-secondary">
                      Achieved <span className="font-mono tabular-nums">{new Date(achievedAt).toLocaleDateString()}</span>
                      {fromLogs && <span className="ml-1 text-text-muted">(from your logs)</span>}
                    </p>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </Card>
    </div>
  )
}
