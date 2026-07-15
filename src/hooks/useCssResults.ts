import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMySwimmer } from './useMySwimmer'

export interface CssResult {
  id: string
  swimmer_id: string
  // Nullable since Milestone 4 (adaptive CSS pacing loop): an accepted CSS
  // tweak is inserted as source = 'adjustment' with only pace_per_100 set —
  // there's no real 400/200 time trial behind it.
  t400: number | null
  t200: number | null
  pace_per_100: number
  source: 'test' | 'adjustment'
  recorded_at: string
}

/** Signed-in swimmer's most recent CSS result. */
export function useMyCssResult() {
  const { data: swimmer } = useMySwimmer()
  return useQuery({
    queryKey: ['css-result', swimmer?.id],
    enabled: Boolean(swimmer?.id),
    queryFn: async (): Promise<CssResult | null> => {
      const { data, error } = await supabase
        .from('css_results')
        .select('*')
        .eq('swimmer_id', swimmer!.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as CssResult | null
    },
  })
}

/** Coach view: most recent CSS result for any swimmer. */
export function useCssResultForSwimmer(swimmerId: string | undefined) {
  return useQuery({
    queryKey: ['css-result-for', swimmerId],
    enabled: Boolean(swimmerId),
    queryFn: async (): Promise<CssResult | null> => {
      const { data, error } = await supabase
        .from('css_results')
        .select('*')
        .eq('swimmer_id', swimmerId!)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as CssResult | null
    },
  })
}

export function useSaveCssResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      swimmer_id: string
      t400: number
      t200: number
      pace_per_100: number
    }) => {
      const { error } = await supabase.from('css_results').insert(input)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['css-result', vars.swimmer_id] })
      qc.invalidateQueries({ queryKey: ['css-result-for', vars.swimmer_id] })
    },
  })
}

/** Milestone 4 — accepting a computeCssTweakSuggestion result. Inserts a
 * new css_results row rather than mutating one in place (there's no
 * mutable "current CSS" field to update — see 027_css_tweak.sql), so
 * subsequent plan generation picks it up via the same
 * order-by-recorded_at-desc query every other read site already uses. */
export function useAcceptCssTweak() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { swimmer_id: string; pace_per_100: number }) => {
      const { error } = await supabase.from('css_results').insert({
        swimmer_id: input.swimmer_id,
        pace_per_100: input.pace_per_100,
        source: 'adjustment',
      })
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['css-result', vars.swimmer_id] })
      qc.invalidateQueries({ queryKey: ['css-result-for', vars.swimmer_id] })
      qc.invalidateQueries({ queryKey: ['css-tweak-suggestion', vars.swimmer_id] })
    },
  })
}
