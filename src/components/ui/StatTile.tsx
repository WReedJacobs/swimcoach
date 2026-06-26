import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * The hero's "instrument" stat cell: a bordered surface panel with a mono
 * uppercase micro-label, a large mono value, and an optional unit/hint.
 * Replaces the chunky icon-tile StatCard on data dashboards for the
 * data-dense, landing-page look. Pass `accent` to tint the value aqua.
 */
export function StatTile({
  label,
  value,
  unit,
  hint,
  accent = false,
  className,
}: {
  label: string
  value: ReactNode
  unit?: string
  hint?: string
  accent?: boolean
  className?: string
}) {
  return (
    <div className={cn('rounded-card border border-border bg-surface p-4', className)}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
        {label}
      </div>
      <div
        className={cn(
          'mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight',
          accent ? 'text-primary' : 'text-text-primary',
        )}
      >
        {value}
        {unit && <span className="ml-1 text-base font-medium text-text-secondary">{unit}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-text-secondary">{hint}</div>}
    </div>
  )
}
