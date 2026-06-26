import { cn } from '@/lib/cn'

export function ProgressBar({
  value,
  max = 100,
  tone = 'blue',
  className,
}: {
  value: number
  max?: number
  tone?: 'blue' | 'green' | 'amber' | 'coral'
  className?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const tones = {
    blue: 'bg-primary',
    green: 'bg-secondary',
    amber: 'bg-accent',
    coral: 'bg-coral',
  }
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-border', className)}>
      <div
        className={cn('h-full rounded-full transition-all', tones[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Circular progress ring — used for beginner weekly distance. */
export function ProgressRing({
  value,
  max,
  label,
  sublabel,
  size = 140,
}: {
  value: number
  max: number
  label: string
  sublabel?: string
  size?: number
}) {
  const stroke = 12
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max))
  const offset = circumference * (1 - pct)
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--c-border))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(var(--c-coral))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-2xl font-semibold text-text-primary">{label}</span>
        {sublabel && <span className="text-xs text-text-secondary">{sublabel}</span>}
      </div>
    </div>
  )
}
