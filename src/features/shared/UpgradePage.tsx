import { useState } from 'react'
import { Check, Sparkles } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useSubscription'
import { useCreateCheckoutSession, type BillingInterval } from '@/hooks/useCheckout'
import type { Plan } from '@/types'

interface PlanDef {
  plan: Plan
  name: string
  monthly: number
  yearly: number
  blurb: string
  features: string[]
}

// ZAR — Paystack's South Africa merchant accounts settle in Rand. Round
// numbers converted from the originally-quoted USD prices, not a live
// exchange-rate feed; adjust freely by re-running the Paystack Plan setup
// with new amounts.
const SWIMMER_PLANS: PlanDef[] = [
  {
    plan: 'ai_coach',
    name: 'AI Coach',
    monthly: 189,
    yearly: 1499,
    blurb: 'A conversational coach grounded in your own logged times and sessions.',
    features: [
      'Ask questions and get answers grounded in your training history',
      'Time-standard benchmarking on every logged time',
      'Race-pace / split calculator',
      'Goal-meet taper planning',
    ],
  },
]

const COACH_PLANS: PlanDef[] = [
  {
    plan: 'coach_pro',
    name: 'Coach Pro',
    monthly: 349,
    yearly: 3499,
    blurb: 'For a growing squad.',
    features: ['Up to 25 swimmers', 'Everything in Free'],
  },
  {
    plan: 'coach_club',
    name: 'Coach Club',
    monthly: 699,
    yearly: 6999,
    blurb: 'For a full club or team.',
    features: ['Unlimited swimmers', 'Everything in Coach Pro'],
  },
]

function PlanCard({ def, interval }: { def: PlanDef; interval: BillingInterval }) {
  const checkout = useCreateCheckoutSession()
  const price = interval === 'month' ? def.monthly : def.yearly
  const [error, setError] = useState<string | null>(null)

  const start = async () => {
    setError(null)
    try {
      await checkout.mutateAsync({ plan: def.plan, interval })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout')
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader title={def.name} subtitle={def.blurb} />
      <div className="mb-4">
        <span className="font-mono text-3xl font-semibold text-text-primary">R{price.toLocaleString()}</span>
        <span className="text-sm text-text-secondary"> / {interval === 'month' ? 'mo' : 'yr'}</span>
      </div>
      <ul className="mb-5 flex-1 space-y-2">
        {def.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {f}
          </li>
        ))}
      </ul>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <Button leftIcon={<Sparkles className="h-4 w-4" />} loading={checkout.isPending} onClick={start}>
        Subscribe
      </Button>
    </Card>
  )
}

export function UpgradePage() {
  const { profile } = useAuth()
  const { data: subscription } = useSubscription()
  const [interval, setInterval] = useState<BillingInterval>('month')

  const plans = profile?.role === 'coach' ? COACH_PLANS : SWIMMER_PLANS

  return (
    <div className="max-w-3xl space-y-8">
      <SectionHeader kicker="Upgrade" />

      {subscription && subscription.status !== 'canceled' && (
        <Card>
          <p className="text-sm text-text-secondary">
            You're currently on <span className="font-medium text-text-primary">{subscription.plan}</span> ({subscription.status}).
          </p>
        </Card>
      )}

      <div className="inline-flex rounded-component border border-border bg-surface p-1">
        {(['month', 'year'] as BillingInterval[]).map((i) => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={`rounded-component px-4 py-1.5 text-sm font-medium transition-colors ${
              interval === i ? 'bg-primary text-on-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {i === 'month' ? 'Monthly' : 'Yearly'}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${plans.length > 1 ? 'sm:grid-cols-2' : 'max-w-sm'}`}>
        {plans.map((def) => (
          <PlanCard key={def.plan} def={def} interval={interval} />
        ))}
      </div>

      <p className="text-xs text-text-muted">
        {profile?.role === 'coach'
          ? 'Free stays free for up to 2 swimmers.'
          : 'Free stays free — no AI features, everything else you already have keeps working.'}
      </p>
    </div>
  )
}
