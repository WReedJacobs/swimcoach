import { useState, useCallback, useEffect, useRef } from 'react'
import { CheckCircle2, Circle, ArrowRight, Library, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { BeginnerTip } from '@/components/ui/BeginnerTip'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { splash, shoreWave } from '@/hooks/useWaterClick'
import { fitnessProgram } from './content'
import { useJourneyStore } from '@/store/beginnerJourneyStore'
import { BEGINNER_PRESETS } from '@/lib/presetCatalog'
import { presetPattern, renderRest, presetTotalMeters, CATEGORY_LABELS } from '@/lib/presetUtils'
import type { CatalogPreset } from '@/lib/presetUtils'

// ─── Ready-made sets panel ────────────────────────────────────────────────────

function BeginnerPresetRow({ preset }: { preset: CatalogPreset }) {
  const [expanded, setExpanded] = useState(false)
  const pattern = presetPattern(preset as Parameters<typeof presetPattern>[0])
  const restStr = renderRest(preset as Parameters<typeof renderRest>[0])
  const totalM = presetTotalMeters(preset as Parameters<typeof presetTotalMeters>[0])

  return (
    <div className="rounded-component border border-border bg-bg p-3">
      <div className="flex items-start gap-2">
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-primary">{preset.title}</p>
          <p className="mt-0.5 font-mono text-xs text-text-secondary">
            {pattern}
            {restStr ? <span className="text-text-muted"> · {restStr}</span> : null}
            {totalM > 0 && <span className="ml-2 text-text-muted">{totalM}m</span>}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="rounded-[3px] border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-text-muted">
              {CATEGORY_LABELS[preset.category]}
            </span>
            {preset.equipment.map((eq) => (
              <span key={eq} className="rounded-[3px] border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
                {eq}
              </span>
            ))}
          </div>
          {preset.description && (
            <button
              onClick={() => setExpanded((x) => !x)}
              className="mt-1 flex items-center gap-0.5 text-[11px] text-text-muted hover:text-text-secondary"
            >
              {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRightIcon className="h-3 w-3" />}
              {expanded ? 'Hide note' : 'Coach note'}
            </button>
          )}
          {expanded && (
            <p className="mt-1 text-xs italic text-text-secondary">{preset.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function ReadyMadeSets() {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-3">
      <Card>
        <button
          onClick={() => setOpen((x) => !x)}
          className="flex w-full items-center gap-2 text-left"
        >
          <Library className="h-4 w-4 shrink-0 text-coral" />
          <h3 className="flex-1 font-semibold text-text-primary">Ready-made sets</h3>
          <span className="font-mono text-xs text-text-muted">{BEGINNER_PRESETS.length}</span>
          {open
            ? <ChevronDown className="h-4 w-4 text-text-muted" />
            : <ChevronRightIcon className="h-4 w-4 text-text-muted" />}
        </button>
        {!open && (
          <p className="mt-1.5 text-sm text-text-secondary">
            Browse {BEGINNER_PRESETS.length} beginner-friendly sets — copy any pattern into your lane session.
          </p>
        )}
        {open && (
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
            {BEGINNER_PRESETS.map((preset, i) => (
              <BeginnerPresetRow key={i} preset={preset} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ─── Fitness programme ────────────────────────────────────────────────────────

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
  const { markStep } = useJourneyStore()

  const toggle = useCallback((key: string) => {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else {
        next.add(key)
        markStep('complete_workout')
      }
      saveDone(next)
      return next
    })
  }, [markStep])

  const totalSessions = fitnessProgram.reduce((acc, w) => acc + w.sessions.length, 0)
  const completedCount = fitnessProgram.reduce(
    (acc, w) =>
      acc + w.sessions.filter((s) => done.has(`w${w.week}-${s.title}`)).length,
    0,
  )
  const programDone = completedCount === totalSessions

  // Shoreline wave (rare, celebratory only) on the false→true transition of
  // finishing the whole programme — not every render while already done.
  const progressCardRef = useRef<HTMLDivElement>(null)
  const wasProgramDone = useRef(programDone)
  useEffect(() => {
    if (programDone && !wasProgramDone.current && progressCardRef.current) {
      shoreWave(progressCardRef.current)
    }
    wasProgramDone.current = programDone
  }, [programDone])

  return (
    <div className="space-y-8">
      <BeginnerTip
        stepId="complete_workout"
        tip="Pick any session from Week 1 and follow it at the pool. Come back and mark it done."
      />
      <Card ref={progressCardRef} className="border-coral/20 bg-coral/5">
        <h2 className="text-xl font-semibold text-text-primary">8-week fitness programme</h2>
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

      <ReadyMadeSets />

      <div className="space-y-5">
        <SectionHeader kicker="Programme" />

        {/* Week 0 — water confidence callout */}
        {fitnessProgram.some((w) => w.week === 0) && (
          <Card className="border-primary/20 bg-primary/5">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-mono text-sm font-semibold text-primary tabular-nums">
                0
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Week 0 — Water Confidence</h3>
                <p className="text-sm text-text-secondary">
                  {fitnessProgram.find((w) => w.week === 0)?.focus}
                </p>
              </div>
            </div>
            <p className="mb-3 text-sm text-text-secondary">
              {fitnessProgram.find((w) => w.week === 0)?.readiness}
            </p>
            <Link to="/beginner/learn/water-confidence">
              <Button size="sm" variant="secondary" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Start Water Confidence guide
              </Button>
            </Link>
          </Card>
        )}

        {fitnessProgram.filter((w) => w.week > 0).map((week) => {
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
                  {'readiness' in week && week.readiness && (
                    <p className="mt-1 text-xs text-text-muted italic">{week.readiness}</p>
                  )}
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
                          onClick={(e) => { splash(e.currentTarget, e); toggle(key) }}
                          className="relative shrink-0 overflow-hidden rounded-full"
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
