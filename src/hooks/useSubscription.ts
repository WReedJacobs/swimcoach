import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Subscription } from '@/types'

/** The signed-in profile's subscription row — null means free tier (no row
 * yet, or Paystack never created one). Read-only; all writes happen via the
 * paystack-webhook handler (service role), never the client. */
export function useSubscription() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['subscription', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Subscription | null> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('profile_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as Subscription | null
    },
  })
}
