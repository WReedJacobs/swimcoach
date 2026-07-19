import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface StravaConnection {
  strava_athlete_id: number
  connected_at: string
  last_synced_at: string | null
}

export interface StravaSession {
  id: string
  title: string
  date: string
  main_set: string | null
  notes: string | null
}

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID as string | undefined

/** Whether the signed-in profile has linked Strava. Only selects the columns
 * needed to render connection status — tokens never reach the browser. */
export function useStravaConnection() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['strava-connection', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<StravaConnection | null> => {
      const { data, error } = await supabase
        .from('strava_connections')
        .select('strava_athlete_id, connected_at, last_synced_at')
        .eq('profile_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

/** Sends the browser to Strava's authorize screen. A random state token
 * round-trips through Strava and is checked on the way back (StravaCallbackPage)
 * as a lightweight CSRF guard. */
export function startStravaConnect() {
  if (!STRAVA_CLIENT_ID) throw new Error('Strava is not configured on this deployment')
  const state = crypto.randomUUID()
  sessionStorage.setItem('strava_oauth_state', state)
  const url = new URL('https://www.strava.com/oauth/authorize')
  url.searchParams.set('client_id', STRAVA_CLIENT_ID)
  url.searchParams.set('redirect_uri', `${window.location.origin}/strava/callback`)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('approval_prompt', 'auto')
  url.searchParams.set('scope', 'read,activity:read')
  url.searchParams.set('state', state)
  window.location.href = url.toString()
}

/** Exchanges an OAuth `code` for tokens via the strava-oauth-exchange edge
 * function. Called once, from StravaCallbackPage. */
export function useStravaOAuthExchange() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.functions.invoke('strava-oauth-exchange', {
        body: { code },
      })
      if (error) throw error
      return data as { athlete: { firstname: string; lastname: string } }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strava-connection', user?.id] })
    },
  })
}

/** Pulls recent Strava swims in as sessions (see strava-sync) — each becomes
 * a session with an auto-generated main_set summary, a linked times row, and
 * a completed session_assignment. */
export function useSyncStrava() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (): Promise<{ imported: number }> => {
      const { data, error } = await supabase.functions.invoke('strava-sync', { body: {} })
      if (error) throw error
      return data as { imported: number }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strava-connection', user?.id] })
      qc.invalidateQueries({ queryKey: ['strava-sessions', user?.id] })
      qc.invalidateQueries({ queryKey: ['times'] })
      qc.invalidateQueries({ queryKey: ['my-swimmer', user?.id] })
    },
  })
}

/** Recently Strava-imported sessions (self-authored: coach_id = own profile),
 * newest first — backs the "Recent imports" card on My Times. */
export function useStravaSessions() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['strava-sessions', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<StravaSession[]> => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, title, date, main_set, notes')
        .eq('coach_id', user!.id)
        .eq('external_source', 'strava')
        .order('date', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []) as StravaSession[]
    },
  })
}

/** Lets the athlete overwrite a Strava-imported session's description —
 * Strava only knows total distance/time, not what sets were actually done. */
export function useUpdateStravaSessionNotes() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from('sessions').update({ notes }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strava-sessions', user?.id] })
    },
  })
}

export function useDisconnectStrava() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('strava_connections')
        .delete()
        .eq('profile_id', user!.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strava-connection', user?.id] })
    },
  })
}
