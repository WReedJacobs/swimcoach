import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { GoogleIcon } from '@/components/ui/GoogleIcon'
import { useAuth } from '@/hooks/useAuth'
import { isLocalMode } from '@/lib/supabase'

/** Shared "Continue with Google" control + divider for LoginPage/SignUpPage. */
export function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth()
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isLocalMode) return null

  const start = async () => {
    setError(null)
    setStarting(true)
    try {
      await signInWithGoogle()
      // On success the browser navigates away to Google; nothing left to do.
    } catch (err) {
      setStarting(false)
      setError(err instanceof Error ? err.message : 'Could not start Google sign-in')
    }
  }

  return (
    <div className="mb-4 space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={starting}
        leftIcon={!starting && <GoogleIcon className="h-4 w-4" />}
        onClick={start}
      >
        Continue with Google
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  )
}
