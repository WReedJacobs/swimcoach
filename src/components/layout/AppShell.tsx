import { Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@/types'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { navForRole } from './nav'

function titleForPath(role: Role | null, pathname: string): string {
  const items = navForRole(role)
  // Longest matching prefix wins (so /coach/roster beats /coach).
  const match = [...items]
    .filter((i) => pathname === i.to || pathname.startsWith(i.to + '/'))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return match?.label ?? 'SwimCoach'
}

/**
 * Sidebar + topbar wrapper. `role` drives the nav, accent colour, and the
 * page title (derived from the active nav item).
 */
export function AppShell({ role }: { role: Role | null }) {
  const { pathname } = useLocation()
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={titleForPath(role, pathname)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
