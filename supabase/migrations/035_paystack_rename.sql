-- Switch the billing provider from Stripe to Paystack (Stripe doesn't
-- support payouts to South African-registered businesses). No real
-- subscriptions exist yet — 034 shipped with no working Stripe keys — so
-- this is a plain rename, not a data migration.
alter table subscriptions rename column stripe_subscription_id to paystack_subscription_code;
alter table subscriptions rename column stripe_customer_id to paystack_customer_code;

-- Paystack requires both the subscription code AND its email_token to
-- disable a subscription via the API (there's no hosted portal to redirect
-- to instead, unlike Stripe) — this is delivered on the subscription.create
-- webhook and has nowhere else to live.
alter table subscriptions add column paystack_email_token text;
