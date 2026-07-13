import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from './AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { isLocalMode } from '@/lib/supabase'
import { demoUsers } from '@/lib/local/fixtures'
import { GoogleSignInButton } from './GoogleSignInButton'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const redirectAfterLogin = () => {
    const { profile } = useAuthStore.getState()
    navigate(profile?.role ? `/${profile.role}` : '/')
  }

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await signIn(values.email, values.password)
      redirectAfterLogin()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  const demoLogin = async (email: string) => {
    setServerError(null)
    try {
      await signIn(email, 'demo')
      redirectAfterLogin()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign in failed')
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Swimphoria account"
      footer={
        <>
          New here?{' '}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
          {' · '}
          <Link to="/beginner" className="font-medium text-coral hover:underline">
            Try beginner mode
          </Link>
        </>
      }
    >
      {isLocalMode && (
        <div className="mb-4 rounded-component border border-primary/20 bg-primary/5 p-3">
          <p className="mb-2 text-xs font-medium text-primary-dark">
            Local mode — no setup needed. Sign in instantly with a demo account:
          </p>
          <div className="flex flex-col gap-2">
            {demoUsers.map((u) => (
              <Button key={u.id} variant="outline" size="sm" onClick={() => demoLogin(u.email)}>
                {u.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <GoogleSignInButton />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="coach@swimphoria.app"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-text-muted hover:text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  )
}
