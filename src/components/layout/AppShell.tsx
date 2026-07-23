import { Outlet, useLocation } from 'react-router-dom'
import type { Role } from '@/types'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { navForRole } from './nav'
import { OceanBackground } from '@/components/OceanBackground'
import { useMySwimmer } from '@/hooks/useMySwimmer'
import { useSwimmerRealtime } from '@/hooks/useSwimmerRealtime'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { useStravaAutoSync } from '@/hooks/useStravaAutoSync'

function titleForPath(role: Role | null, pathname: string): string {
  const items = navForRole(role)
  const match = [...items]
    .filter((i) => pathname === i.to || pathname.startsWith(i.to + '/'))
    .sort((a, b) => b.to.length - a.to.length)[0]
  if (match) return match.label
  if (pathname.endsWith('/settings')) return 'Settings'
  return 'Swimphoria'
}

/** Null-render component that sets up realtime notifications for a swimmer. */
function SwimmerRealtimeLayer() {
  const { data: swimmer } = useMySwimmer()
  useSwimmerRealtime(swimmer?.id)
  return null
}

/** Null-render component that flushes the offline time-log queue on reconnect. */
function OfflineSyncLayer() {
  useOfflineSync()
  return null
}

/** Null-render component that silently syncs Strava in the background on
 * app open, if connected and due (see useStravaAutoSync). Available to any
 * role — Strava can be connected from Settings regardless of role. */
function StravaAutoSyncLayer() {
  useStravaAutoSync()
  return null
}

export function AppShell({ role }: { role: Role | null }) {
  const { pathname } = useLocation()
  return (
    <div className="flex h-screen overflow-hidden">
      <OceanBackground />
      {role === 'swimmer' && <SwimmerRealtimeLayer />}
      <OfflineSyncLayer />
      <StravaAutoSyncLayer />
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={titleForPath(role, pathname)} />
        <main className="flex-1 overflow-y-auto p-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav role={role} />
    </div>
  )
}
