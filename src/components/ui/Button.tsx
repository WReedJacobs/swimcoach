import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

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
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const coral = accent === 'coral'
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
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-component font-medium transition-colors',
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
