import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useStravaOAuthExchange, useSyncStrava } from '@/hooks/useStrava'

/**
 * Landing target for Strava's OAuth redirect (see startStravaConnect in
 * useStrava.ts). Exchanges the `code` for tokens, kicks off an initial sync,
 * then hands back to Settings — mirrors AuthCallbackPage's shape.
 */
export function StravaCallbackPage() {
  const { isAuthenticated, initialized, profile } = useAuth()
  const navigate = useNavigate()
  const exchange = useStravaOAuthExchange()
  const sync = useSyncStrava()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  // Settings only exists nested under each role (/coach/settings etc.) —
  // fall back to '/' (HomeRedirect) if the role isn't known yet.
  const settingsPath = profile?.role ? `/${profile.role}/settings` : '/'

  useEffect(() => {
    if (!initialized || started.current) return
    started.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const strandedState = sessionStorage.getItem('strava_oauth_state')
    sessionStorage.removeItem('strava_oauth_state')

    ;(async () => {
      if (params.get('error')) {
        navigate(settingsPath, { replace: true })
        return
      }
      if (!isAuthenticated || !code || !state || state !== strandedState) {
        throw new Error('Could not verify the connection request. Please try again from Settings.')
      }
      await exchange.mutateAsync(code)
      await sync.mutateAsync().catch(() => undefined)
      navigate(settingsPath, { replace: true })
    })().catch((e) => setError(e instanceof Error ? e.message : 'Could not connect Strava'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, isAuthenticated, navigate, settingsPath])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg p-4 text-center">
        <p className="text-sm text-text-secondary">{error}</p>
        <Link to={settingsPath} className="text-sm font-medium text-primary hover:underline">
          Back to Settings
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
