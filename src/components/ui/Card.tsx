import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
  /** Adds a hover lift + accent border — for clickable cards. */
  interactive?: boolean
}

export function Card({ children, padding = true, interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // Deepwater depth: hairline border + soft drop shadow so panels read
        // as raised off the abyssal canvas, matching the hero's dashboard card.
        'rounded-card border border-border bg-surface shadow-[0_18px_44px_-34px_rgba(0,0,0,0.75)]',
        interactive &&
          'cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_28px_60px_-34px_rgba(0,0,0,0.85)]',
        padding && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  )
}
