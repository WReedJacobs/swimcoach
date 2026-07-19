import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { AgeBracket, DietPattern, NutritionProfile, TrainingVolume, TypicalSessionTime } from '@/types'

/** The signed-in profile's nutrition setup — training + preference inputs
 * only, editable in Settings. Null until the swimmer completes setup once. */
export function useNutritionProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['nutrition-profile', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<NutritionProfile | null> => {
      const { data, error } = await supabase
        .from('nutrition_profiles')
        .select('*')
        .eq('profile_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as NutritionProfile | null
    },
  })
}

export interface SaveNutritionProfileInput {
  training_volume: TrainingVolume
  typical_session_time: TypicalSessionTime
  diet_pattern: DietPattern[]
  allergies: string | null
  age_bracket: AgeBracket
}

export function useSaveNutritionProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SaveNutritionProfileInput) => {
      const { error } = await supabase
        .from('nutrition_profiles')
        .upsert({ profile_id: user!.id, ...input }, { onConflict: 'profile_id' })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nutrition-profile', user?.id] })
    },
  })
}

/** Coach-facing: whether a given swimmer has set up nutrition — a boolean
 * only (via the has_nutrition_profile RPC), never the row itself. Coaches
 * aren't meant to see diet pattern/allergies/age, just this one fact. */
export function useHasNutritionProfile(swimmerProfileId: string | null | undefined) {
  return useQuery({
    queryKey: ['has-nutrition-profile', swimmerProfileId],
    enabled: Boolean(swimmerProfileId),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc('has_nutrition_profile', {
        target_profile_id: swimmerProfileId!,
      })
      if (error) throw error
      return Boolean(data)
    },
  })
}
