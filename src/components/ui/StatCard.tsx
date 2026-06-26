import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Card } from './Card'

type Tone = 'blue' | 'green' | 'amber' | 'coral'

const iconTones: Record<Tone, string> = {
  blue: 'bg-primary/10 text-primary',
  green: 'bg-secondary/10 text-secondary',
  amber: 'bg-accent/10 text-accent',
  coral: 'bg-coral/10 text-coral',
}

export function StatCard({
  label,
  value,
  icon,
  tone = 'blue',
  hint,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: Tone
  hint?: string
}) {
  return (
    <Card className="flex items-center gap-4">
      <div
        className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-component',
          iconTones[tone],
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
        <p className="font-mono text-2xl font-semibold text-text-primary">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-text-secondary">{hint}</p>}
      </div>
    </Card>
  )
}
