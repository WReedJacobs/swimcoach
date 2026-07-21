import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!
const APP_URL = Deno.env.get('APP_URL')!

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const VALID_PLANS = ['ai_coach', 'coach_pro', 'coach_club']
const VALID_INTERVALS = ['month', 'year']

// Paystack Plan codes live in env secrets (PAYSTACK_PLAN_AI_COACH_MONTH,
// etc.) — set once via `supabase secrets set` after creating the Plans via
// the Paystack API, never hardcoded, so switching test->live keys is a
// secrets swap, not a code change.
function planEnvKey(plan: string, interval: string): string {
  return `PAYSTACK_PLAN_${plan.toUpperCase()}_${interval.toUpperCase()}`
}

// No trial: this charges immediately. Paystack subscriptions bill off a
// Plan with no delayed-first-charge equivalent to Stripe's trial_period_days
// — the free trial the original spec wanted isn't implemented here.
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller?.email) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { plan, interval } = await req.json()
    if (!VALID_PLANS.includes(plan) || !VALID_INTERVALS.includes(interval)) {
      return new Response(JSON.stringify({ error: 'Invalid plan or interval' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const planCode = Deno.env.get(planEnvKey(plan, interval))
    if (!planCode) {
      return new Response(JSON.stringify({ error: `No Paystack plan configured for ${plan}/${interval}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // /upgrade only exists nested under a role (/coach/upgrade,
    // /swimmer/upgrade) — look up the role so the post-payment redirect
    // lands somewhere real instead of a dead route.
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()
    const upgradePath = `/${profile?.role ?? 'swimmer'}/upgrade`

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: caller.email,
        plan: planCode,
        callback_url: `${APP_URL}${upgradePath}?checkout=success`,
        metadata: { profile_id: caller.id, plan },
      }),
    })
    const body = await res.json()
    if (!res.ok || !body.status) {
      throw new Error(body.message ?? 'Paystack transaction initialize failed')
    }

    return new Response(JSON.stringify({ url: body.data.authorization_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('create-checkout-session error:', err instanceof Error ? err.stack ?? err.message : String(err))
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
