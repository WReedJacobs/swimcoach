import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Swimmer, Session } from '@/types'

/** The swimmer record linked to the signed-in swimmer's profile. */
export function useMySwimmer() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-swimmer', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Swimmer | null> => {
      const { data, error } = await supabase
        .from('swimmers')
        .select('*')
        .eq('profile_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return (data as Swimmer) ?? null
    },
  })
}

/** Sessions assigned to a given swimmer (via session_assignments). */
export function useAssignedSessions(swimmerId: string | undefined) {
  return useQuery({
    queryKey: ['assigned-sessions', swimmerId],
    enabled: Boolean(swimmerId),
    queryFn: async (): Promise<Session[]> => {
      const { data, error } = await supabase
        .from('session_assignments')
        .select('session:sessions(*)')
        .eq('swimmer_id', swimmerId!)
      if (error) throw error
      // The embedded `session` may be typed as an array by the client; normalise.
      const sessions = ((data ?? []) as Array<{ session: Session | Session[] | null }>)
        .flatMap((row) => (Array.isArray(row.session) ? row.session : row.session ? [row.session] : []))
      return sessions.sort((a, b) => +new Date(b.date) - +new Date(a.date))
    },
  })
}
