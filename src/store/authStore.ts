import { create } from 'zustand'
import type { Session as AuthSession } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/types'

interface AuthState {
  session: AuthSession | null
  profile: Profile | null
  loading: boolean
  initialized: boolean

  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  setRole: (role: Role, level?: Profile['level']) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('[auth] failed to load profile', error)
    return null
  }
  return data as Profile | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    const session = data.session
    const profile = session ? await fetchProfile(session.user.id) : null
    set({ session, profile, initialized: true })

    supabase.auth.onAuthStateChange(async (_event, newSession) => {
      const nextProfile = newSession
        ? await fetchProfile(newSession.user.id)
        : null
      set({ session: newSession, profile: nextProfile })
    })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } finally {
      set({ loading: false })
    }
  },

  signUp: async (email, password, fullName) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw error
    } finally {
      set({ loading: false })
    }
  },

  setRole: async (role, level) => {
    const { session } = get()
    if (!session) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('profiles')
      .update({ role, level: level ?? null })
      .eq('id', session.user.id)
    if (error) throw error
    await get().refreshProfile()
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
  },

  refreshProfile: async () => {
    const { session } = get()
    if (!session) return
    const profile = await fetchProfile(session.user.id)
    set({ profile })
  },
}))
