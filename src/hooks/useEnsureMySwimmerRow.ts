import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { useMySwimmer } from './useMySwimmer'

/**
 * Auto-creates a swimmer row when a user with role='swimmer' has no existing row.
 * This handles users who gained the swimmer role via RoleSelectPage, GraduationModal,
 * or admin reassignment — paths that call profiles.update({ role }) without also
 * inserting into swimmers. Safe to call in multiple components; the ref guard
 * prevents duplicate concurrent inserts.
 */
export function useEnsureMySwimmerRow() {
  const { user, profile } = useAuth()
  const { data: swimmer, isLoading } = useMySwimmer()
  const queryClient = useQueryClient()
  const creating = useRef(false)

  useEffect(() => {
    if (!user || !profile || isLoading || creating.current) return
    if (swimmer !== null) return
    if (profile.role !== 'swimmer') return

    creating.current = true
    supabase
      .from('swimmers')
      .insert({
        coach_id: user.id,
        profile_id: user.id,
        display_name: profile.full_name || 'Swimmer',
        level: profile.level ?? 'beginner',
      })
      .then(() => {
        creating.current = false
        queryClient.invalidateQueries({ queryKey: ['my-swimmer', user.id] })
      })
  }, [user, profile, isLoading, swimmer, queryClient])
}
