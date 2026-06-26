import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Booking, BookingStatus } from '@/types'

/** Bookings visible to the current coach. */
export function useBookings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['bookings', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Booking[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('coach_id', user!.id)
        .order('requested_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Booking[]
    },
  })
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  })
}
