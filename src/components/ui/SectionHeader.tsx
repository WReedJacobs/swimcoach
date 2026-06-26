import type { ReactNode } from 'react'

/**
 * The hero's section header: a mono uppercase kicker followed by a hairline
 * rule that fills the row (e.g. "OVERVIEW ————————"). Optional trailing action.
 * Use it to separate major page sections so feature pages echo the landing.
 */
export function SectionHeader({
  kicker,
  action,
}: {
  kicker: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
        {kicker}
      </span>
      <span className="h-px flex-1 bg-border" />
      {action}
    </div>
  )
}
