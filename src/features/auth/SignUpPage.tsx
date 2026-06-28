import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from './AuthLayout'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'

const schema = z.object({
  fullName: z.string().min(2, 'Enter your name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})
type FormValues = z.infer<typeof schema>

export function SignUpPage() {
  const { signUp, loading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await signUp(values.email, values.password, values.fullName)
      // After sign-up, send to role selection.
      navigate('/role-select')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Sign up failed')
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join Swimphoria in seconds"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Alex Carter"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {serverError && <p className="text-sm text-danger">{serverError}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
