-- Migration: Add stripe_customer_id to profiles for subscription billing
-- Date: 2026-02-12

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Index for quick lookups when receiving Stripe webhooks
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
