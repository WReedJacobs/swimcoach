import { useAuthStore } from '@/store/authStore'

/**
 * Thin selector hook over the auth store so components don't import the
 * store directly (keeps a stable surface if we swap state libs later).
 */
export function useAuth() {
  const session = useAuthStore((s) => s.session)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)
  const initialized = useAuthStore((s) => s.initialized)
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const signOut = useAuthStore((s) => s.signOut)
  const setRole = useAuthStore((s) => s.setRole)

  return {
    session,
    profile,
    user: session?.user ?? null,
    role: profile?.role ?? null,
    isAuthenticated: Boolean(session),
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    setRole,
  }
}
