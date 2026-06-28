import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export function useAllProfiles() {
  return useQuery({
    queryKey: ['admin', 'profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useSetAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isAdmin }: { id: string; isAdmin: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'profiles'] }),
  })
}
