import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Watch,
  ChevronDown,
  Sparkles,
  Waves,
  Trophy,
  UserCog,
  User,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { BrandMark } from '@/components/BrandMark'
import { cn } from '@/lib/cn'
import { formatTime } from '@/lib/formatTime'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { STROKES, type Level } from '@/types'
import { useOnboardingDraft, LEVEL_TEMPLATES, pacePer100, type OnboardingRole } from './onboardingStore'

const v = (name: string, alpha?: number) =>
  alpha == null ? `rgb(var(${name}))` : `rgb(var(${name}) / ${alpha})`

// Step indices
// 0: Role (coach or swimmer)
// 1: Level + goal (swimmer only)
// 2: First swim (swimmer only)
// 3: Tracker (swimmer only)
// 4: Account wall
// 5: Done

const LEVEL_ICON: Record<Level, typeof Waves> = {
  beginner: Sparkles,
  intermediate: Waves,
  advanced: Trophy,
  elite: Trophy,
}

async function waitForSession(ms = 2500): Promise<boolean> {
  const start = performance.now()
  while (performance.now() - start < ms) {
    if (useAuthStore.getState().session) return true
    await new Promise((r) => setTimeout(r, 80))
  }
  return Boolean(useAuthStore.getState().session)
}

function Stepper({
  label,
  display,
  onDec,
  onInc,
}: {
  label: string
  display: string
  onDec: () => void
  onInc: () => void
}) {
  const btn =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-component border border-border text-xl text-text-secondary transition-colors hover:border-primary hover:text-primary'
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <button type="button" onClick={onDec} className={btn} aria-label={`Decrease ${label}`}>−</button>
        <span className="min-w-[5ch] flex-1 text-center font-mono text-2xl font-semibold tabular-nums text-text-primary">
          {display}
        </span>
        <button type="button" onClick={onInc} className={btn} aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  )
}

export function OnboardingFlow() {
  const navigate = useNavigate()
  const { signUp, signIn } = useAuth()
  const [draft, setDraft] = useOnboardingDraft()
  const [step, setStep] = useState(0)

  const [trackerOpen, setTrackerOpen] = useState(false)
  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [existing, setExisting] = useState(false)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const pace = pacePer100(draft.session.distanceMeters, draft.session.timeSeconds)

  const isCoach = draft.onboardingRole === 'coach'

  // Coaches skip swimmer-only steps (1, 2, 3) → role(0) → account(4) → done(5)
  const next = () => {
    if (step === 0 && isCoach) { setStep(4); return }
    if (step === 4 && isCoach) { setStep(5); return }
    setStep((s) => Math.min(5, s + 1))
  }
  const back = () => {
    if (step === 4 && isCoach) { setStep(0); return }
    setStep((s) => Math.max(0, s - 1))
  }

  // Progress bar: coaches see 2 segments, swimmers see 5
  const visibleSteps = isCoach ? [0, 4] : [0, 1, 2, 3, 4]
  const visibleIndex = visibleSteps.indexOf(step)
  const totalVisible = visibleSteps.length

  const chooseRole = (role: OnboardingRole) => {
    setDraft((d) => ({ ...d, onboardingRole: role }))
  }

  const chooseLevel = (level: Level) => {
    const t = LEVEL_TEMPLATES[level]
    setDraft((d) => ({ ...d, level, weeklyGoalMeters: t.weeklyGoalMeters, session: { ...t.session } }))
  }

  const adjust = (delta: Partial<{ distanceMeters: number; timeSeconds: number }>) =>
    setDraft((d) => ({
      ...d,
      session: {
        ...d.session,
        distanceMeters: Math.max(50, d.session.distanceMeters + (delta.distanceMeters ?? 0)),
        timeSeconds: Math.max(15, d.session.timeSeconds + (delta.timeSeconds ?? 0)),
      },
    }))

  const submitAccount = async () => {
    setAuthError(null)
    setExisting(false)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
      const ok = await waitForSession()
      if (!ok) {
        setAuthError('Check your email to confirm your account, then sign in.')
        return
      }

      const role = draft.onboardingRole ?? 'swimmer'
      try {
        await useAuthStore.getState().setRole(role, role === 'swimmer' ? (draft.level ?? undefined) : undefined)
      } catch {
        // non-fatal
      }

      // For new swimmers, create a self-managed swimmer record and save the first swim
      if (mode === 'signup' && role === 'swimmer') {
        const userId = useAuthStore.getState().session?.user.id
        if (userId) {
          const { data: swimmerRow } = await supabase
            .from('swimmers')
            .insert({
              coach_id: userId,
              profile_id: userId,
              display_name: name.trim() || 'Swimmer',
              level: draft.level ?? 'beginner',
            })
            .select('id')
            .single()

          if (swimmerRow) {
            await supabase.from('times').insert({
              swimmer_id: swimmerRow.id,
              stroke: draft.session.stroke,
              distance: draft.session.distanceMeters,
              time_seconds: draft.session.timeSeconds,
              is_pb: true,
              is_self_logged: true,
            })
          }
        }
      }

      next()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      if (/already|exist|registered/i.test(msg)) {
        setExisting(true)
        setAuthError('That email already has an account.')
      } else {
        setAuthError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center px-4 py-8"
      style={{ background: v('--c-bg'), color: v('--c-text-primary') }}
    >
      <div className="w-full max-w-lg">
        {/* Header + progress */}
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/')} aria-label="Home">
            <BrandMark />
          </button>
          {step < 5 && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted">
              Step {Math.max(1, visibleIndex + 1)} / {totalVisible}
            </span>
          )}
        </div>
        {step < 5 && (
          <div className="mb-8 flex gap-1.5">
            {Array.from({ length: totalVisible }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= visibleIndex ? 'bg-primary' : 'bg-border',
                )}
              />
            ))}
          </div>
        )}

        {/* Step 0 — Role selection */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">I am a…</h1>
              <p className="mt-1 text-sm text-text-secondary">Choose your role — you can always change this later in settings.</p>
            </div>
            <div className="space-y-3">
              {(
                [
                  {
                    role: 'swimmer' as OnboardingRole,
                    Icon: User,
                    title: 'Swimmer',
                    blurb: 'Track my times, follow sessions, hit my goals',
                  },
                  {
                    role: 'coach' as OnboardingRole,
                    Icon: UserCog,
                    title: 'Coach',
                    blurb: 'Manage a roster, build sessions, log times for my athletes',
                  },
                ] as const
              ).map(({ role, Icon, title, blurb }) => {
                const active = draft.onboardingRole === role
                return (
                  <button
                    key={role}
                    onClick={() => chooseRole(role)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all',
                      active
                        ? 'border-primary bg-primary/10 shadow-[inset_2px_0_0_rgb(var(--c-primary))]'
                        : 'border-border bg-surface hover:border-primary/45',
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-component bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{title}</p>
                      <p className="text-sm text-text-secondary">{blurb}</p>
                    </div>
                    {active && <Check className="h-5 w-5 text-primary" />}
                  </button>
                )
              })}
            </div>
            <Button className="w-full" size="lg" disabled={!draft.onboardingRole} onClick={next}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1 — Level + goal (swimmer only) */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Set your goal</h1>
              <p className="mt-1 text-sm text-text-secondary">Three taps — no typing. This tailors the whole app to you.</p>
            </div>
            <div className="space-y-3">
              {(Object.keys(LEVEL_TEMPLATES) as Level[]).map((lvl) => {
                const t = LEVEL_TEMPLATES[lvl]
                const Icon = LEVEL_ICON[lvl]
                const active = draft.level === lvl
                return (
                  <button
                    key={lvl}
                    onClick={() => chooseLevel(lvl)}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-card border p-4 text-left transition-all',
                      active
                        ? 'border-primary bg-primary/10 shadow-[inset_2px_0_0_rgb(var(--c-primary))]'
                        : 'border-border bg-surface hover:border-primary/45',
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-component bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-text-primary">{t.title}</p>
                      <p className="text-sm text-text-secondary">{t.blurb}</p>
                    </div>
                    {active && <Check className="h-5 w-5 text-primary" />}
                  </button>
                )
              })}
            </div>
            {draft.level && (
              <Card>
                <Stepper
                  label="Weekly distance goal"
                  display={`${draft.weeklyGoalMeters.toLocaleString()} m`}
                  onDec={() => setDraft((d) => ({ ...d, weeklyGoalMeters: Math.max(500, d.weeklyGoalMeters - 500) }))}
                  onInc={() => setDraft((d) => ({ ...d, weeklyGoalMeters: d.weeklyGoalMeters + 500 }))}
                />
              </Card>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button className="flex-1" size="lg" disabled={!draft.level} onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — First swim (swimmer only) */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Log your first swim</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Pre-filled from your level — just adjust and go. No blank form.
              </p>
            </div>
            {draft.level && (
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-muted">
                Suggested · {LEVEL_TEMPLATES[draft.level].session.setLabel}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {STROKES.map((s) => (
                <button
                  key={s}
                  onClick={() => setDraft((d) => ({ ...d, session: { ...d.session, stroke: s } }))}
                  className={cn(
                    'rounded-[3px] border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors',
                    draft.session.stroke === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-text-secondary hover:border-primary/45',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <Card className="space-y-5">
              <Stepper
                label="Total distance"
                display={`${draft.session.distanceMeters} m`}
                onDec={() => adjust({ distanceMeters: -50 })}
                onInc={() => adjust({ distanceMeters: 50 })}
              />
              <Stepper
                label="Total time"
                display={formatTime(draft.session.timeSeconds)}
                onDec={() => adjust({ timeSeconds: -15 })}
                onInc={() => adjust({ timeSeconds: 15 })}
              />
              <div className="rounded-component border border-border bg-bg p-4 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Pace / 100m</div>
                <div className="mt-1 font-mono text-3xl font-semibold tabular-nums text-primary">
                  {pace != null ? formatTime(pace) : '—'}
                </div>
              </div>
            </Card>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button className="flex-1" size="lg" onClick={next}>Looks good <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Step 3 — Tracker (swimmer only) */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">You're already logging</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Manual logging takes 15 seconds and is a first-class path. Connecting a watch is optional.
              </p>
            </div>
            <Card padding={false}>
              <button
                onClick={() => setTrackerOpen((o) => !o)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="flex items-center gap-3">
                  <Watch className="h-5 w-5 text-text-secondary" />
                  <span>
                    <span className="block text-sm font-medium text-text-primary">Connect a tracker</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Optional</span>
                  </span>
                </span>
                <ChevronDown className={cn('h-4 w-4 text-text-muted transition-transform', trackerOpen && 'rotate-180')} />
              </button>
              {trackerOpen && (
                <div className="space-y-2 border-t border-border p-4">
                  {['Garmin Connect', 'Apple Watch'].map((dev) => (
                    <button
                      key={dev}
                      onClick={() => setDraft((d) => ({ ...d, deviceConnected: true }))}
                      className="flex w-full items-center justify-between rounded-component border border-border px-3 py-2.5 text-sm transition-colors hover:border-primary/45"
                    >
                      <span>{dev}</span>
                      {draft.deviceConnected ? (
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary">Connected</span>
                      ) : (
                        <ArrowRight className="h-4 w-4 text-text-muted" />
                      )}
                    </button>
                  ))}
                  <p className="text-xs text-text-muted">You can also connect later from Settings — sync never blocks logging.</p>
                </div>
              )}
            </Card>
            <div className="flex gap-3">
              <Button variant="ghost" size="lg" onClick={back}><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button className="flex-1" size="lg" onClick={next}>
                {draft.deviceConnected ? 'Continue' : 'Skip & add later'} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Account wall */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isCoach ? 'Create your coach account' : 'Save your progress'}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {mode === 'signup'
                  ? isCoach
                    ? 'A free account gives you your full coaching dashboard.'
                    : 'Create a free account to keep your swim and goal.'
                  : 'Welcome back — sign in to continue.'}
              </p>
            </div>

            {/* Recap (swimmers only) */}
            {!isCoach && (
              <Card className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Your first swim</span>
                  <span className="font-mono tabular-nums text-text-primary">
                    {draft.session.distanceMeters}m · {formatTime(draft.session.timeSeconds)}
                    {pace != null && <span className="text-text-secondary"> · {formatTime(pace)}/100m</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">Weekly goal</span>
                  <span className="font-mono tabular-nums text-text-primary">{draft.weeklyGoalMeters.toLocaleString()} m</span>
                </div>
              </Card>
            )}

            <div className="space-y-3">
              {mode === 'signup' && (
                <Input label="Name" placeholder="Alex Carter" value={name} onChange={(e) => setName(e.target.value)} />
              )}
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={email.length > 0 && !emailValid ? 'Enter a valid email' : undefined}
              />
              <Input
                label="Password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {authError && (
                <p className="text-sm text-danger">
                  {authError}
                  {existing && (
                    <button
                      onClick={() => { setMode('signin'); setAuthError(null); setExisting(false) }}
                      className="ml-1 font-medium text-primary hover:underline"
                    >
                      Log in instead
                    </button>
                  )}
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                loading={submitting}
                disabled={!emailValid || password.length < 6 || (mode === 'signup' && name.trim().length < 2)}
                onClick={submitAccount}
              >
                {mode === 'signup' ? 'Create account' : 'Sign in'}
              </Button>
              <p className="text-center text-sm text-text-secondary">
                {mode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
                <button
                  onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setAuthError(null) }}
                  className="font-medium text-primary hover:underline"
                >
                  {mode === 'signup' ? 'Log in instead' : 'Sign up'}
                </button>
              </p>
            </div>
            <button onClick={back} className="mx-auto flex items-center gap-1 text-sm text-text-muted hover:text-text-primary">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          </div>
        )}

        {/* Step 5 — Done */}
        {step === 5 && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-glow">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">You're in</h1>
              <p className="mt-1 text-sm text-text-secondary">
                {isCoach
                  ? 'Your dashboard is ready. Add your first swimmer to get started.'
                  : 'Your first swim is on the timeline and your streak starts today.'}
              </p>
            </div>
            {!isCoach && (
              <Card className="text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted">First swim</span>
                  <span className="font-mono tabular-nums text-text-primary">
                    {draft.session.distanceMeters}m · {formatTime(draft.session.timeSeconds)}
                  </span>
                </div>
              </Card>
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={() => navigate(isCoach ? '/coach' : '/swimmer')}
            >
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
