import { useEffect, useRef } from 'react'
import { useStravaConnection, useSyncStrava } from './useStrava'

/** Only auto-sync if it's been at least this long since the last sync (auto
 * or manual) — keeps opening/foregrounding the app from hammering Strava's
 * API or tripping its rate limit. */
const MIN_INTERVAL_MS = 20 * 60 * 1000

/**
 * Silently syncs Strava in the background once per app session, if a
 * connection exists and enough time has passed since the last sync. Mount
 * once per authenticated session (see AppShell's StravaAutoSyncLayer) — the
 * ref guard stops a second sync firing from a re-render or React
 * StrictMode's double-invocation, not just repeat mounts.
 */
export function useStravaAutoSync() {
  const { data: connection, isLoading } = useStravaConnection()
  const sync = useSyncStrava()
  const attempted = useRef(false)

  useEffect(() => {
    if (isLoading || attempted.current || !connection) return

    const lastSynced = connection.last_synced_at ? new Date(connection.last_synced_at).getTime() : 0
    const dueForSync = Date.now() - lastSynced > MIN_INTERVAL_MS
    if (!dueForSync) return

    attempted.current = true
    sync.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, connection])
}
