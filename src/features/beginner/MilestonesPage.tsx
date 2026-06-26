import { CheckCircle2, Circle } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { cn } from '@/lib/cn'
import { MILESTONES, useMilestones } from './beginnerStore'

export function MilestonesPage() {
  const [milestones, setMilestones] = useMilestones()

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

  return (
    <div className="space-y-8">
      <SectionHeader kicker="Milestones" />
    <Card>
      <CardHeader title="Milestones" subtitle="Tap one when you reach it — your progress is saved on this device" />
      <ul className="space-y-2">
        {MILESTONES.map((m) => {
          const achievedAt = stateFor(m.distance)
          const done = Boolean(achievedAt)
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
