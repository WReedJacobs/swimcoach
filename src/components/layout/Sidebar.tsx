import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { BrandMark } from '@/components/BrandMark'
import type { Role } from '@/types'
import { navForRole } from './nav'

export function Sidebar({ role }: { role: Role | null }) {
  const items = navForRole(role)
  const beginner = role === 'beginner'

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-border px-5">
        <BrandMark
          tone={beginner ? 'coral' : 'primary'}
          tagline={role ? `${role} mode` : undefined}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-component px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? beginner
                    ? 'bg-coral/10 text-coral shadow-[inset_2px_0_0_rgb(var(--c-coral))]'
                    : 'bg-primary/10 text-primary shadow-[inset_2px_0_0_rgb(var(--c-primary))]'
                  : 'text-text-secondary hover:bg-bg hover:text-text-primary',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
