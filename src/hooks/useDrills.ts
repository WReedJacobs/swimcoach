import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Drill } from '@/types'

/** Global (built-in) drills plus any owned by the current coach. */
export function useDrills() {
  return useQuery({
    queryKey: ['drills'],
    queryFn: async (): Promise<Drill[]> => {
      const { data, error } = await supabase
        .from('drills')
        .select('*')
        .order('title', { ascending: true })
      if (error) throw error
      return (data ?? []) as Drill[]
    },
  })
}
