import { useState } from 'react'
import { ChevronDown, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Badge } from '@/components/ui/Badge'
import { BeginnerTip } from '@/components/ui/BeginnerTip'
import { cn } from '@/lib/cn'
import { laneEtiquette, equipment } from './content'

export function PoolGuidePage() {
  const [openRule, setOpenRule] = useState<number | null>(null)

  return (
    <div className="space-y-8">
      <BeginnerTip
        stepId="read_pool_guide"
        tip="Read through this page — understanding lane etiquette will make your first session much less intimidating."
        autoMark
      />
      <Card className="border-coral/20 bg-coral/5">
        <h2 className="text-xl font-semibold text-text-primary">Your pool survival guide</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Everything they don't tell you when you sign up. Learn this once and you'll feel at home in any pool.
        </p>
      </Card>

      <div>
        <SectionHeader kicker="Lane etiquette" />
        <Card className="divide-y divide-border p-0">
          {laneEtiquette.map((rule, i) => {
            const isOpen = openRule === i
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenRule(isOpen ? null : i)}
                  className={cn(
                    'flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors',
                    isOpen
                      ? 'bg-coral/5'
                      : 'hover:bg-coral/[0.07] hover:shadow-[inset_2px_0_0_rgb(var(--c-coral))]',
                  )}
                >
                  <span className="font-medium text-text-primary">{rule.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-text-muted transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="rounded-component bg-bg p-3 text-sm text-text-secondary">{rule.body}</p>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      </div>

      <div>
        <SectionHeader kicker="What to bring" />
        <div className="grid gap-4 sm:grid-cols-2">
          {equipment.map((item) => (
            <Card key={item.name}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl" aria-hidden>{item.emoji}</span>
                  <h3 className="font-semibold text-text-primary">{item.name}</h3>
                </div>
                <Badge tone={item.essential ? 'coral' : 'gray'} className="shrink-0">
                  {item.essential ? 'Essential' : 'Optional'}
                </Badge>
              </div>
              <p className="text-sm text-text-secondary">{item.what}</p>
              <div className="mt-3 flex items-start gap-2 text-xs text-text-muted">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{item.when}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
