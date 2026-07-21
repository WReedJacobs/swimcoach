import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Paystack signs webhooks with an HMAC-SHA512 of the raw body, keyed by the
// SAME secret key used for API calls — unlike Stripe there's no separate
// webhook-signing secret.
async function verifySignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!signature) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(PAYSTACK_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  )
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody))
  const computed = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('')
  return computed === signature
}

// This is the only writer to `subscriptions` — the row a client could edit
// themselves would not be a real entitlement (see 034/035's RLS: read-only).
//
// NOTE ON PAYLOAD SHAPES: written from Paystack's documented event shapes,
// not verified against real sandbox events yet (no live account was
// available while building this) — re-check each event's actual field
// paths against real webhook deliveries in the Paystack dashboard before
// relying on this in production, particularly the subscription.create
// correlation logic below.
Deno.serve(async (req) => {
  const signature = req.headers.get('x-paystack-signature')
  const rawBody = await req.text()

  if (!(await verifySignature(rawBody, signature))) {
    console.error('paystack-webhook: signature verification failed')
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody)

  try {
    if (event.event === 'charge.success') {
      // The initial subscription-linked charge — metadata (set at
      // transaction/initialize) is reliably present here, so this is where
      // profile_id/plan get attached. The subscription_code itself isn't
      // known yet; that arrives separately via subscription.create.
      const profileId = event.data?.metadata?.profile_id
      const plan = event.data?.metadata?.plan
      const customerCode = event.data?.customer?.customer_code

      if (profileId && plan) {
        await adminClient.from('subscriptions').upsert(
          {
            profile_id: profileId,
            plan,
            status: 'active',
            paystack_customer_code: customerCode ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id' },
        )
      }
    } else if (event.event === 'subscription.create') {
      // No metadata on this event — correlate back to a profile via the
      // customer_code we stored from charge.success moments earlier.
      const customerCode = event.data?.customer?.customer_code
      const subscriptionCode = event.data?.subscription_code
      const emailToken = event.data?.email_token
      const nextPaymentDate = event.data?.next_payment_date

      if (customerCode && subscriptionCode) {
        await adminClient
          .from('subscriptions')
          .update({
            status: 'active',
            paystack_subscription_code: subscriptionCode,
            paystack_email_token: emailToken ?? null,
            current_period_end: nextPaymentDate ? new Date(nextPaymentDate).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('paystack_customer_code', customerCode)
      }
    } else if (event.event === 'invoice.update' && event.data?.status === 'success') {
      // A renewal charge — push current_period_end forward.
      const subscriptionCode = event.data?.subscription?.subscription_code
      const nextPaymentDate = event.data?.subscription?.next_payment_date
      if (subscriptionCode && nextPaymentDate) {
        await adminClient
          .from('subscriptions')
          .update({
            status: 'active',
            current_period_end: new Date(nextPaymentDate).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('paystack_subscription_code', subscriptionCode)
      }
    } else if (event.event === 'invoice.payment_failed') {
      const subscriptionCode = event.data?.subscription?.subscription_code
      if (subscriptionCode) {
        await adminClient
          .from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('paystack_subscription_code', subscriptionCode)
      }
    } else if (event.event === 'subscription.disable' || event.event === 'subscription.not_renew') {
      const subscriptionCode = event.data?.subscription_code
      if (subscriptionCode) {
        await adminClient
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('paystack_subscription_code', subscriptionCode)
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('paystack-webhook handling error:', err instanceof Error ? err.stack ?? err.message : String(err))
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
