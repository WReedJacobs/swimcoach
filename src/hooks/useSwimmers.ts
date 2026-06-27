import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Swimmer, Level } from '@/types'

/** All swimmers for the signed-in coach, with their joined profile. */
export function useSwimmers() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['swimmers', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Swimmer[]> => {
      const { data, error } = await supabase
        .from('swimmers')
        .select('*, profile:profiles!swimmers_profile_id_fkey(*)')
        .eq('coach_id', user!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as Swimmer[]
    },
  })
}

export function useSwimmer(swimmerId: string | undefined) {
  return useQuery({
    queryKey: ['swimmer', swimmerId],
    enabled: Boolean(swimmerId),
    queryFn: async (): Promise<Swimmer> => {
      const { data, error } = await supabase
        .from('swimmers')
        .select('*, profile:profiles!swimmers_profile_id_fkey(*)')
        .eq('id', swimmerId!)
        .single()
      if (error) throw error
      return data as Swimmer
    },
  })
}

export interface AddSwimmerInput {
  full_name: string
  email: string
  level: Level
  squad: string
  notes: string
}

export function useAddSwimmer() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: AddSwimmerInput) => {
      const { data, error } = await supabase
        .from('swimmers')
        .insert({
          coach_id: user!.id,
          display_name: input.full_name,
          invite_email: input.email || null,
          squad: input.squad || null,
          level: input.level,
          notes: input.notes || null,
        })
        .select('*')
        .single()
      if (error) throw error
      return data as Swimmer
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['swimmers', user?.id] })
    },
  })
}

export function useUpdateSwimmer() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<AddSwimmerInput>) => {
      const { error } = await supabase
        .from('swimmers')
        .update({
          display_name: input.full_name,
          invite_email: input.email ?? null,
          squad: input.squad ?? null,
          level: input.level,
          notes: input.notes ?? null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['swimmers', user?.id] })
      qc.invalidateQueries({ queryKey: ['swimmer'] })
    },
  })
}

export function useDeleteSwimmer() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('swimmers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['swimmers', user?.id] }),
  })
}
