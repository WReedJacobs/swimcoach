import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, LogIn, Bell, Trophy, Info, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications, type InAppNotif } from '@/context/NotificationContext'
import { useStravaConnection, useSyncStrava } from '@/hooks/useStrava'
import { formatRelativeTime } from '@/lib/relativeTime'
import { cn } from '@/lib/cn'

/** Persistent sync control, visible on every page once Strava is connected —
 * previously this only lived as a button buried in Settings. Icon spins
 * while syncing; the title attr doubles as the "last synced X ago" status
 * the profile-page-only button never surfaced anywhere obvious. */
function StravaSyncButton() {
  const { data: connection } = useStravaConnection()
  const sync = useSyncStrava()

  if (!connection) return null

  const label = sync.isPending
    ? 'Syncing Strava…'
    : `Strava · synced ${formatRelativeTime(connection.last_synced_at)}`

  return (
    <button
      onClick={() => sync.mutate()}
      disabled={sync.isPending}
      className="rounded-full p-1.5 text-text-secondary transition-colors hover:bg-surface hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
      aria-label={label}
      title={label}
    >
      <RefreshCw className={cn('h-5 w-5', sync.isPending && 'animate-spin')} />
    </button>
  )
}

function notifIcon(type: InAppNotif['type']) {
  switch (type) {
    case 'pb':
      return <Trophy className="h-3.5 w-3.5 text-accent" />
    case 'success':
      return <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
    case 'warning':
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
    default:
      return <Info className="h-3.5 w-3.5 text-primary" />
  }
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead } = useNotifications()

  useEffect(() => {
    markAllRead()
  }, [markAllRead])

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-card border border-border bg-bg shadow-lg">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-sm font-semibold text-text-primary">Notifications</span>
        <button
          onClick={onClose}
          className="text-xs text-text-muted hover:text-text-primary"
          aria-label="Close notifications"
        >
          Close
        </button>
      </div>
      {notifications.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-text-muted">Nothing here yet</p>
      ) : (
        <ul className="max-h-72 divide-y divide-border/50 overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start gap-2.5 px-4 py-3">
              <span className="mt-0.5 shrink-0">{notifIcon(n.type)}</span>
              <div className="min-w-0">
                <p className="text-sm text-text-primary">{n.message}</p>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                  {n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TopBar({ title }: { title: string }) {
  const { profile, isAuthenticated, signOut } = useAuth()
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const settingsPath =
    profile?.role === 'coach'
      ? '/coach/settings'
      : profile?.role === 'swimmer'
        ? '/swimmer/settings'
        : profile?.role === 'beginner'
          ? '/beginner/settings'
          : null

  useEffect(() => {
    if (!panelOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [panelOpen])

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg/80 px-6 backdrop-blur-md">
      <h1 className="text-lg font-semibold tracking-tight text-text-primary">{title}</h1>

      <div className="flex items-center gap-3">
        {isAuthenticated && profile ? (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-text-primary">{profile.full_name || 'You'}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{profile.role}</p>
            </div>

            <StravaSyncButton />

            {/* Notification bell */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setPanelOpen((v) => !v)}
                className={cn(
                  'relative rounded-full p-1.5 transition-colors hover:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40',
                  panelOpen && 'bg-surface',
                )}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="h-5 w-5 text-text-secondary" />
                {unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-mono text-[9px] font-bold text-on-primary">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {panelOpen && <NotificationPanel onClose={() => setPanelOpen(false)} />}
            </div>

            <button
              onClick={() => settingsPath && navigate(settingsPath)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40"
              aria-label="Settings"
              title="Settings"
            >
              <Avatar name={profile.full_name || 'You'} url={profile.avatar_url} />
            </button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={async () => {
                await signOut()
                navigate('/')
              }}
            >
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogIn className="h-4 w-4" />}
            onClick={() => navigate('/login')}
          >
            Sign in
          </Button>
        )}
      </div>
    </header>
  )
}
