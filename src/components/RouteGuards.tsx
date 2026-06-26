import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import type { Role } from '@/types'

function FullPageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

/**
 * Requires authentication and (optionally) a specific role. If the user is
 * signed in but hasn't picked a role yet, send them to role select.
 */
export function ProtectedRoute({
  role,
  children,
}: {
  role?: Role
  children: ReactNode
}) {
  const { initialized, isAuthenticated, profile } = useAuth()

  if (!initialized) return <FullPageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (profile && !profile.role) return <Navigate to="/role-select" replace />
  if (role && profile?.role && profile.role !== role) {
    return <Navigate to={`/${profile.role}`} replace />
  }
  return <>{children}</>
}

/** Sends an authenticated user to their role's home; used for "/" and auth pages. */
export function HomeRedirect() {
  const { initialized, isAuthenticated, profile } = useAuth()
  if (!initialized) return <FullPageLoader />
  if (!isAuthenticated) return <Navigate to="/welcome" replace />
  if (!profile?.role) return <Navigate to="/role-select" replace />
  return <Navigate to={`/${profile.role}`} replace />
}
