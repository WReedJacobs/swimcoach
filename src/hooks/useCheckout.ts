import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Plan } from '@/types'

export type BillingInterval = 'month' | 'year'

/** Redirects to a Paystack Checkout page for the given plan/interval. The
 * actual entitlement is only ever granted by paystack-webhook writing to
 * `subscriptions` — this just starts the payment flow. No trial: charges
 * immediately (Paystack has no delayed-first-charge subscription option). */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async ({ plan, interval }: { plan: Plan; interval: BillingInterval }) => {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan, interval },
      })
      if (error) throw error
      return data as { url: string }
    },
    onSuccess: ({ url }) => {
      window.location.href = url
    },
  })
}

/** Cancels the signed-in profile's subscription via Paystack's subscription
 * API. Paystack has no hosted Customer Portal (unlike Stripe), so this is a
 * custom in-app action rather than a redirect — the row itself updates once
 * the subscription.disable webhook confirms it, not immediately here. */
export function useCancelSubscription() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('cancel-subscription', { body: {} })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', user?.id] })
    },
  })
}
