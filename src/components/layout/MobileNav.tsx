import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Settings, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { navForRole } from './nav'
import type { NavItem } from './nav'
import type { Role } from '@/types'

// Which nav items are promoted to the 3 primary tabs per role.
// Everything else goes into the "More" drawer.
const PRIMARY_PATHS: Partial<Record<Role, string[]>> = {
  coach:   ['/coach', '/coach/roster', '/coach/log'],
  swimmer: ['/swimmer', '/swimmer/today', '/swimmer/times'],
  beginner:['/beginner', '/beginner/strokes', '/beginner/log'],
}

export function MobileNav({ role }: { role: Role | null }) {
  const allItems = navForRole(role)
  const { pathname } = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Close drawer whenever the route changes
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  const primaryPaths = role ? (PRIMARY_PATHS[role] ?? allItems.slice(0, 3).map((i) => i.to)) : []
  const primaryPathSet = new Set(primaryPaths)
  const primaryItems = primaryPaths
    .map((p) => allItems.find((item) => item.to === p))
    .filter((item): item is NavItem => Boolean(item))
  const moreItems = allItems.filter((item) => !primaryPathSet.has(item.to))

  const beginner = role === 'beginner'
  const activeClass = beginner ? 'text-coral' : 'text-primary'
  const drawerActiveAccent = beginner
    ? 'shadow-[inset_2px_0_0_rgb(var(--c-coral))] bg-coral/10 text-coral font-medium'
    : 'shadow-[inset_2px_0_0_rgb(var(--c-primary))] bg-primary/10 text-primary-dark font-medium'

  const settingsPath =
    role === 'coach' ? '/coach/settings' : role === 'swimmer' ? '/swimmer/settings' : null

  return (
    <>
      {/* ── Bottom tab bar ──────────────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-surface md:hidden">
        {primaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to.split('/').length <= 2}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
                isActive ? activeClass : 'text-text-muted hover:text-text-primary',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive ? activeClass : 'text-text-muted')} />
                <span className="max-w-[9ch] truncate text-center font-mono text-[9px] uppercase leading-tight tracking-wide">
                  {item.mobileLabel ?? item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}

        {/* "More" tab */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors',
            drawerOpen ? activeClass : 'text-text-muted hover:text-text-primary',
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="font-mono text-[9px] uppercase leading-tight tracking-wide">More</span>
        </button>
      </nav>

      {/* ── Backdrop ────────────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-300',
          drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setDrawerOpen(false)}
      />

      {/* ── Slide-up drawer ─────────────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 overflow-y-auto bg-surface md:hidden',
          'rounded-t-modal transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ maxHeight: '80vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pb-1 pt-3">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        <nav className="px-3 pb-8">
          {moreItems.map((item) => {
            const isRootPath = item.to.split('/').length <= 2
            const isActive = isRootPath ? pathname === item.to : pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-component px-4 py-3 text-sm transition-colors',
                  isActive
                    ? drawerActiveAccent
                    : 'text-text-secondary hover:bg-bg hover:text-text-primary',
                )}
              >
                <item.icon className={cn('h-5 w-5 shrink-0', isActive ? activeClass : 'text-text-muted')} />
                {item.label}
              </NavLink>
            )
          })}

          {settingsPath && (
            <>
              <div className="my-2 border-t border-border" />
              <NavLink
                to={settingsPath}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-component px-4 py-3 text-sm transition-colors',
                    isActive
                      ? drawerActiveAccent
                      : 'text-text-secondary hover:bg-bg hover:text-text-primary',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Settings className={cn('h-5 w-5 shrink-0', isActive ? activeClass : 'text-text-muted')} />
                    Settings
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </>
  )
}
