import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { multiRipple, splash } from '@/hooks/useWaterClick'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  /** Beginner mode tints primary buttons coral. */
  accent?: 'default' | 'coral'
  /**
   * WATER-EFFECTS-DESIGN.md section 4 — click feedback. 'ripple' (default)
   * is the app-wide baseline for ordinary actions; 'splash' is for
   * beginner-mode logging/goal actions specifically; 'none' opts out
   * (e.g. destructive actions, or a button that navigates away instantly).
   */
  waterEffect?: 'ripple' | 'splash' | 'none'
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      accent = 'default',
      waterEffect = 'ripple',
      className,
      children,
      disabled,
      onClick,
      ...props
    },
    ref,
  ) => {
    const coral = accent === 'coral'
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (waterEffect === 'ripple') multiRipple(e.currentTarget, e)
      else if (waterEffect === 'splash') splash(e.currentTarget, e)
      onClick?.(e)
    }
    const variants: Record<Variant, string> = {
      // Aqua is too light for white text — use the dark on-primary ink,
      // and let the accent glow lift the primary action off the canvas.
      primary: coral
        ? 'bg-coral text-white hover:bg-coral/90'
        : 'bg-primary text-on-primary shadow-glow hover:bg-primary-dark',
      secondary: 'bg-secondary text-white hover:bg-secondary/90',
      outline:
        'border border-border bg-surface text-text-primary hover:bg-bg',
      ghost: 'text-text-secondary hover:bg-bg hover:text-text-primary',
      danger: 'bg-danger text-white hover:bg-danger/90',
    }
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-component font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50',
          sizes[size],
          variants[variant],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    )
  },
)
Button.displayName = 'Button'
