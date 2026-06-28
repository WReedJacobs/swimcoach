import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BeginnerTip } from '@/components/ui/BeginnerTip'
import { cn } from '@/lib/cn'
import { effortLevels, trainingFacts } from './content'

const effortBorder: Record<string, string> = {
  Easy: 'border-l-4 border-secondary',
  'Threshold (CSS)': 'border-l-4 border-primary',
  Hard: 'border-l-4 border-accent',
  Sprint: 'border-l-4 border-danger',
}

export function TrainingBasicsPage() {
  const [openFact, setOpenFact] = useState<number | null>(null)

  return (
    <div className="space-y-8">
      <BeginnerTip
        stepId="read_training_basics"
        tip="Coaches use specific notation for sessions. This page explains what it all means."
        autoMark
      />
      {/* Effort levels */}
      <div>
        <SectionHeader kicker="Effort levels" />
        <div className="space-y-3">
          {effortLevels.map((e) => (
            <div
              key={e.name}
              className={cn(
                'rounded-card border border-border bg-surface p-4',
                effortBorder[e.name] ?? 'border-l-4 border-border',
              )}
            >
              <h3 className="font-semibold text-text-primary">{e.name}</h3>
              <p className="font-mono text-sm tabular-nums text-text-secondary">{e.pace}</p>
              <p className="mt-2 text-sm text-text-secondary">{e.breathing}</p>
              <p className="text-sm text-text-secondary">{e.feel}</p>
              <p className="mt-2 text-xs text-text-muted">{e.usedFor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How to read a session */}
      <div>
        <SectionHeader kicker="How to read a session" />
        <Card>
          <CardHeader title="Decoding the notation" subtitle="What all those numbers actually mean" />
          <div className="rounded-component bg-bg p-4 font-mono text-lg">
            <span className="text-coral font-bold">8</span>
            <span className="text-text-muted"> × </span>
            <span className="text-primary font-bold">100m</span>
            <span className="text-text-muted"> @ </span>
            <span className="text-secondary font-bold">1:45</span>
            <span className="text-text-muted"> on </span>
            <span className="text-accent font-bold">2:15</span>
          </div>
          <dl className="mt-4 space-y-3">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-mono text-sm font-medium text-coral">8</dt>
              <dd className="text-sm text-text-secondary">Number of repetitions — you'll swim this block 8 times.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-mono text-sm font-medium text-primary">× 100m</dt>
              <dd className="text-sm text-text-secondary">Distance per rep — each repetition is 100 metres (4 lengths of a 25m pool).</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-mono text-sm font-medium text-secondary">@ 1:45</dt>
              <dd className="text-sm text-text-secondary">Target time per rep — aim to touch the wall in 1 minute 45 seconds or faster.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 font-mono text-sm font-medium text-accent">on 2:15</dt>
              <dd className="text-sm text-text-secondary">Send-off interval — you leave for the next rep every 2 minutes 15 seconds, regardless of when you arrived. Watch the pace clock on the wall.</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Common questions */}
      <div>
        <SectionHeader kicker="Common questions" />
        <Card className="divide-y divide-border p-0">
          {trainingFacts.map((fact, i) => {
            const isOpen = openFact === i
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenFact(isOpen ? null : i)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors',
                    isOpen
                      ? 'bg-primary/5'
                      : 'hover:bg-primary/[0.05] hover:shadow-[inset_2px_0_0_rgb(var(--c-primary))]',
                  )}
                >
                  <span className="font-medium text-text-primary">{fact.question}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-text-muted transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="rounded-component bg-bg p-3 text-sm text-text-secondary">{fact.answer}</p>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
