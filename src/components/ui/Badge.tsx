import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Level } from '@/types'

type Tone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'coral'

const tones: Record<Tone, string> = {
  gray: 'bg-bg text-text-secondary border-border',
  blue: 'bg-primary/10 text-primary-dark border-primary/20',
  green: 'bg-secondary/10 text-secondary border-secondary/20',
  amber: 'bg-accent/10 text-accent border-accent/20',
  red: 'bg-danger/10 text-danger border-danger/20',
  coral: 'bg-coral/10 text-coral border-coral/20',
}

export function Badge({
  children,
  tone = 'gray',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[3px] border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const levelTone: Record<Level, Tone> = {
  beginner: 'coral',
  intermediate: 'blue',
  advanced: 'amber',
  elite: 'green',
}

export function LevelBadge({ level }: { level: Level }) {
  return (
    <Badge tone={levelTone[level]} className="capitalize">
      {level}
    </Badge>
  )
}
