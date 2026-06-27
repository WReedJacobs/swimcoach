import { useState, useCallback } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { beginnerProgram } from './content'

const STORAGE_KEY = 'sc_program_done'

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

export function BeginnerProgram() {
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

  const totalSessions = beginnerProgram.reduce((acc, w) => acc + w.sessions.length, 0)
  const completedCount = beginnerProgram.reduce(
    (acc, w) =>
      acc + w.sessions.filter((s) => done.has(`w${w.week}-${s.title}`)).length,
    0,
  )

  return (
    <div className="space-y-8">
      <Card className="border-coral/20 bg-coral/5">
        <h2 className="text-xl font-semibold text-text-primary">Your 4-week starter plan</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Two short sessions a week. Go at your own pace — it's fine to repeat a week before moving on.
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
        {beginnerProgram.map((week) => {
          const weekDone = week.sessions.filter((s) => done.has(`w${week.week}-${s.title}`)).length
          return (
            <Card key={week.week}>
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-coral text-sm font-semibold text-white font-mono tabular-nums">
                  {week.week}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">Week <span className="font-mono tabular-nums">{week.week}</span></h3>
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
              <div className="grid gap-3 sm:grid-cols-2">
                {week.sessions.map((s) => {
                  const key = `w${week.week}-${s.title}`
                  const completed = done.has(key)
                  return (
                    <button
                      key={s.title}
                      onClick={() => toggle(key)}
                      className={`rounded-component border p-4 text-left transition-colors ${
                        completed
                          ? 'border-secondary/30 bg-secondary/5'
                          : 'border-border hover:border-border/70 hover:bg-bg'
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className={`font-medium ${completed ? 'text-secondary' : 'text-text-primary'}`}>
                          {s.title}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge tone="coral">{s.distance}</Badge>
                          {completed ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-secondary" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-text-muted" />
                          )}
                        </div>
                      </div>
                      <p className={`text-sm ${completed ? 'text-secondary/70' : 'text-text-secondary'}`}>
                        {s.what}
                      </p>
                    </button>
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
