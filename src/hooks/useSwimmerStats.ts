import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Profile } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────

export interface SwimmerStatsRow {
  id: string
  user_id: string
  ovr: number
  prev_ovr: number
  spd: number
  end_stat: number
  tec: number
  con: number
  prg: number
  com: number
  tier: string
  main_stroke: string | null
  signature_event: string | null
  signature_time_seconds: number | null
  last_calculated: string
  created_at: string
}

export interface LeaderboardEntry extends SwimmerStatsRow {
  profile: Pick<Profile, 'id' | 'full_name' | 'display_handle' | 'role' | 'avatar_url'> | null
}

// ─── Own stats ────────────────────────────────────────────────────────────

export function useMyStats() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-stats', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<SwimmerStatsRow | null> => {
      const { data, error } = await supabase
        .from('swimmer_stats')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data as SwimmerStatsRow | null
    },
  })
}

export function useRecalculateStats() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.rpc('recalc_swimmer_stats', {
        target_user: user.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-stats'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

export function useSwimmerStatsByUserId(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['swimmer-stats', userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<SwimmerStatsRow | null> => {
      const { data, error } = await supabase
        .from('swimmer_stats')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle()
      if (error) throw error
      return data as SwimmerStatsRow | null
    },
  })
}

// ─── Public leaderboard ───────────────────────────────────────────────────

export function useLeaderboard(sortBy: keyof SwimmerStatsRow = 'ovr') {
  return useQuery({
    queryKey: ['leaderboard', sortBy],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_handle, role, avatar_url')
        .eq('is_public', true)
        .eq('role', 'swimmer')
      if (!profiles?.length) return []
      const ids = profiles.map((p) => p.id)
      const { data: stats, error } = await supabase
        .from('swimmer_stats')
        .select('*')
        .in('user_id', ids)
        .order(sortBy, { ascending: false })
        .limit(20)
      if (error) throw error
      const profileMap = new Map(profiles.map((p) => [p.id, p]))
      return ((stats ?? []) as SwimmerStatsRow[]).map((s) => ({
        ...s,
        profile: profileMap.get(s.user_id) ?? null,
      }))
    },
  })
}

export function useSquadLeaderboard(coachId: string | null) {
  return useQuery({
    queryKey: ['leaderboard', 'squad', coachId],
    enabled: Boolean(coachId),
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, display_handle, role, avatar_url')
        .eq('coach_id', coachId!)
        .eq('role', 'swimmer')
      if (!profiles?.length) return []
      const ids = profiles.map((p) => p.id)
      const { data: stats, error } = await supabase
        .from('swimmer_stats')
        .select('*')
        .in('user_id', ids)
        .order('ovr', { ascending: false })
      if (error) throw error
      const profileMap = new Map(profiles.map((p) => [p.id, p]))
      return ((stats ?? []) as SwimmerStatsRow[]).map((s) => ({
        ...s,
        profile: profileMap.get(s.user_id) ?? null,
      }))
    },
  })
}

// ─── Admin hooks ──────────────────────────────────────────────────────────

export function useAllStats() {
  return useQuery({
    queryKey: ['admin', 'all-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('swimmer_stats')
        .select('*, profile:profiles!user_id(full_name, role, email, avatar_url)')
        .order('ovr', { ascending: false })
      if (error) throw error
      return data as Array<
        SwimmerStatsRow & {
          profile: { full_name: string; role: string; email?: string; avatar_url: string | null } | null
        }
      >
    },
  })
}

export function useAdminRecalculate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('recalc_swimmer_stats', {
        target_user: userId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'all-stats'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

// ─── Public profile toggle ────────────────────────────────────────────────

export function useSetPublic() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (isPublic: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_public: isPublic })
        .eq('id', user!.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'profile'] }),
  })
}
