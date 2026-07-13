import { useEffect } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { splash } from '@/hooks/useWaterClick'
import { MILESTONES, useMilestones, useBeginnerLogs } from './beginnerStore'
import { useJourneyStore } from '@/store/beginnerJourneyStore'

export function MilestonesPage() {
  const [milestones, setMilestones] = useMilestones()
  const [logs] = useBeginnerLogs()
  const { markStep } = useJourneyStore()

  // Auto-achieve distance milestones when the user has logged a swim of that
  // distance or more. Bails out returning the same array reference when
  // nothing changed — depending on `milestones` itself while unconditionally
  // calling setMilestones() every run was an infinite render loop (each
  // setMilestones produced a new array via .map(), which re-triggered this
  // same effect via the milestones dependency, forever).
  useEffect(() => {
    const maxLogged = logs.reduce((max, l) => Math.max(max, l.distance), 0)
    setMilestones((prev) => {
      let changed = false
      const next = prev.map((m) => {
        if (!m.achievedAt && m.distance <= maxLogged) {
          changed = true
          return { ...m, achievedAt: new Date().toISOString() }
        }
        return m
      })
      return changed ? next : prev
    })
  }, [logs, setMilestones])

  const hasAnyAchieved = milestones.some((m) => m.achievedAt)
  useEffect(() => {
    if (hasAnyAchieved) markStep('first_milestone')
  }, [hasAnyAchieved, markStep])

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
                onClick={(e) => { splash(e.currentTarget, e); toggle(m.distance) }}
                className={cn(
                  'relative overflow-hidden flex w-full items-center gap-3 rounded-card border p-4 text-left transition-colors',
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
