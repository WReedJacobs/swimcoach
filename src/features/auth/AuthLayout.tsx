import type { ReactNode } from 'react'
import { BrandMark } from '@/components/BrandMark'

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <BrandMark align="center" />
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
          </div>
        </div>
        <div className="rounded-card border border-border bg-surface p-6 shadow-sm">
          {children}
        </div>
        {footer && <div className="mt-4 text-center text-sm text-text-secondary">{footer}</div>}
      </div>
    </div>
  )
}
