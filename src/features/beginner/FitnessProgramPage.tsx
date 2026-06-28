import { useState, useCallback } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { fitnessProgram } from './content'

const STORAGE_KEY = 'sc_fitness_done'

function loadDone(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveDone(done: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...done]))
}

const effortBorderClass: Record<string, string> = {
  easy: 'border-l-4 border-secondary',
  threshold: 'border-l-4 border-primary',
  hard: 'border-l-4 border-accent',
}

export function FitnessProgramPage() {
  const [done, setDone] = useState<Set<string>>(() => loadDone())

  const toggle = useCallback((key: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      saveDone(next)
      return next
    })
  }, [])

  const totalSessions = fitnessProgram.reduce((acc, w) => acc + w.sessions.length, 0)
  const completedCount = fitnessProgram.reduce(
    (acc, w) =>
      acc + w.sessions.filter((s) => done.has(`w${w.week}-${s.title}`)).length,
    0,
  )

  return (
    <div className="space-y-8">
      <Card className="border-coral/20 bg-coral/5">
        <h2 className="text-xl font-semibold text-text-primary">4-week fitness program</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Two sessions a week, each with a warm-up, main set, and cool-down. Go at your own pace — it's fine to repeat a week before moving on.
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-coral transition-all duration-500"
              style={{ width: `${(completedCount / totalSessions) * 100}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs tabular-nums text-text-secondary">
            {completedCount}/{totalSessions}
          </span>
        </div>
      </Card>

      <div className="space-y-5">
        <SectionHeader kicker="Program" />
        {fitnessProgram.map((week) => {
          const weekDone = week.sessions.filter((s) => done.has(`w${week.week}-${s.title}`)).length
          return (
            <Card key={week.week}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral font-mono text-sm font-semibold text-white tabular-nums">
                  {week.week}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">
                      Week <span className="font-mono tabular-nums">{week.week}</span>
                    </h3>
                    {weekDone === week.sessions.length && (
                      <CheckCircle2 className="h-4 w-4 text-secondary" />
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{week.focus}</p>
                </div>
                <span className="shrink-0 font-mono text-xs tabular-nums text-text-muted">
                  {weekDone}/{week.sessions.length}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {week.sessions.map((session) => {
                  const key = `w${week.week}-${session.title}`
                  const completed = done.has(key)
                  return (
                    <div
                      key={session.title}
                      className={cn(
                        'rounded-component border p-4 transition-colors',
                        completed ? 'border-secondary/30 bg-secondary/5' : 'border-border',
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h4 className={cn('font-medium', completed ? 'text-secondary' : 'text-text-primary')}>
                          {session.title}
                        </h4>
                        <button
                          onClick={() => toggle(key)}
                          className="shrink-0"
                          aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {completed ? (
                            <CheckCircle2 className="h-5 w-5 text-secondary" />
                          ) : (
                            <Circle className="h-5 w-5 text-text-muted hover:text-secondary" />
                          )}
                        </button>
                      </div>

                      <div className="mb-3 flex flex-wrap gap-1.5">
                        <Badge tone="coral">{session.totalDistance}</Badge>
                        <Badge tone="gray">{session.effortSummary}</Badge>
                      </div>

                      <div className="space-y-2">
                        {session.blocks.map((block, bi) => (
                          <div
                            key={bi}
                            className={cn(
                              'rounded-r-component bg-bg py-2 pl-3 pr-2',
                              effortBorderClass[block.effort],
                            )}
                          >
                            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
                              {block.label}
                            </p>
                            <p className="mt-0.5 text-sm text-text-secondary">{block.content}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-2 rounded-component border border-coral/20 bg-coral/5 p-3">
                        <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-coral">
                          Coach note
                        </span>
                        <p className="text-sm text-text-secondary">{session.coachNote}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
