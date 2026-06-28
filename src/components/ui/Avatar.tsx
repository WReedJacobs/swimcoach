import { useState } from 'react'
import { cn } from '@/lib/cn'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function Avatar({
  name,
  url,
  size = 'md',
  className,
}: {
  name: string
  url?: string | null
  size?: keyof typeof sizes
  className?: string
}) {
  const [imgError, setImgError] = useState(false)

  if (url && !imgError) {
    return (
      <img
        src={url}
        alt={name}
        onError={() => setImgError(true)}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary-dark',
        sizes[size],
        className,
      )}
      aria-label={name}
    >
      {initials(name)}
    </div>
  )
}
