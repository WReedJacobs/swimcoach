import { cn } from '@/lib/cn'

/**
 * The Deepwater brand lockup: a glowing accent dot + "SwimCoach" wordmark,
 * with an optional mono micro-label beneath. Used in the marketing hero,
 * the app sidebar, and the auth screens so the identity is identical
 * everywhere. Beginner mode tints the dot coral.
 */
export function BrandMark({
  tagline,
  tone = 'primary',
  align = 'left',
}: {
  tagline?: string
  tone?: 'primary' | 'coral'
  align?: 'left' | 'center'
}) {
  const color = tone === 'coral' ? 'rgb(var(--c-coral))' : 'rgb(var(--c-primary))'
  return (
    <div
      className={cn(
        'flex items-center gap-2.5',
        align === 'center' && 'flex-col gap-2 text-center',
      )}
    >
      <span
        className="block shrink-0 rounded-full"
        style={{ width: 13, height: 13, background: color, boxShadow: `0 0 14px ${color}` }}
      />
      <div className={cn(align === 'center' && 'flex flex-col items-center')}>
        <p
          className="font-semibold leading-tight text-text-primary"
          style={{ letterSpacing: '0.04em' }}
        >
          SwimCoach
        </p>
        {tagline && (
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">
            {tagline}
          </p>
        )}
      </div>
    </div>
  )
}
