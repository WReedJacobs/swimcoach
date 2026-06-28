import { Outlet, Link } from 'react-router-dom'
import { Shield, ArrowLeft, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function AdminShell() {
  const { profile } = useAuth()
  const backTo = profile?.role ? `/${profile.role}` : '/'

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <Shield className="h-4 w-4 text-danger" />
          <span
            className="font-semibold text-text-primary"
            style={{ letterSpacing: '0.04em' }}
          >
            Admin
          </span>
        </div>
        <nav className="flex-1 p-2">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 rounded-component px-3 py-2 text-sm font-medium text-text-secondary hover:bg-primary/[0.07] hover:text-text-primary"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
        </nav>
        <div className="border-t border-border p-2">
          <Link
            to={backTo}
            className="flex items-center gap-2 rounded-component px-3 py-2 text-sm text-text-muted hover:text-text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-surface px-4 md:px-6">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 md:hidden">
            <Shield className="h-4 w-4 text-danger" />
            <span className="font-semibold text-text-primary">Admin</span>
          </div>
          <Link
            to={backTo}
            className="ml-auto flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to app
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
