import { describe, it, expect } from 'vitest'
import { hasEntitlement, rosterCap, canAddSwimmer } from './entitlements'
import type { Subscription } from '../types'

function makeSub(overrides: Partial<Subscription>): Subscription {
  return {
    id: 'sub-1',
    profile_id: 'profile-1',
    plan: 'free',
    status: 'active',
    current_period_end: null,
    paystack_subscription_code: null,
    paystack_customer_code: null,
    paystack_email_token: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('hasEntitlement', () => {
  it('is false with no subscription', () => {
    expect(hasEntitlement(null, 'ai_coach')).toBe(false)
  })

  it('is false on the free plan', () => {
    expect(hasEntitlement(makeSub({ plan: 'free' }), 'ai_coach')).toBe(false)
  })

  it('is true for ai_coach on an active ai_coach plan', () => {
    expect(hasEntitlement(makeSub({ plan: 'ai_coach', status: 'active' }), 'ai_coach')).toBe(true)
  })

  it('is true during a trial', () => {
    expect(hasEntitlement(makeSub({ plan: 'ai_coach', status: 'trialing' }), 'ai_coach')).toBe(true)
  })

  it('is false when past_due or canceled, even on a paid plan', () => {
    expect(hasEntitlement(makeSub({ plan: 'ai_coach', status: 'past_due' }), 'ai_coach')).toBe(false)
    expect(hasEntitlement(makeSub({ plan: 'ai_coach', status: 'canceled' }), 'ai_coach')).toBe(false)
  })

  it('extra_roster is granted by coach_pro and coach_club, not ai_coach', () => {
    expect(hasEntitlement(makeSub({ plan: 'coach_pro' }), 'extra_roster')).toBe(true)
    expect(hasEntitlement(makeSub({ plan: 'coach_club' }), 'extra_roster')).toBe(true)
    expect(hasEntitlement(makeSub({ plan: 'ai_coach' }), 'extra_roster')).toBe(false)
  })
})

describe('rosterCap', () => {
  it('caps free (or no subscription) at 2', () => {
    expect(rosterCap(null)).toBe(2)
    expect(rosterCap(makeSub({ plan: 'free' }))).toBe(2)
  })

  it('caps coach_pro at 25', () => {
    expect(rosterCap(makeSub({ plan: 'coach_pro' }))).toBe(25)
  })

  it('coach_club is unlimited (null)', () => {
    expect(rosterCap(makeSub({ plan: 'coach_club' }))).toBeNull()
  })

  it('a canceled paid plan falls back to the free cap', () => {
    expect(rosterCap(makeSub({ plan: 'coach_pro', status: 'canceled' }))).toBe(2)
  })
})

describe('canAddSwimmer', () => {
  it('allows the 1st and 2nd swimmer on free, blocks the 3rd', () => {
    expect(canAddSwimmer(null, 0)).toBe(true)
    expect(canAddSwimmer(null, 1)).toBe(true)
    expect(canAddSwimmer(null, 2)).toBe(false)
  })

  it('never blocks on coach_club regardless of count', () => {
    expect(canAddSwimmer(makeSub({ plan: 'coach_club' }), 500)).toBe(true)
  })
})
