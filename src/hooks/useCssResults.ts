import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMySwimmer } from './useMySwimmer'

export interface CssResult {
  id: string
  swimmer_id: string
  t400: number
  t200: number
  pace_per_100: number
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
