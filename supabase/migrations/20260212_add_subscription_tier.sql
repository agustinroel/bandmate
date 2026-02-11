-- Migration: Add subscription tier column to profiles
-- Date: 2026-02-12

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_tier text NOT NULL DEFAULT 'free';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Ensure only valid tiers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_tier'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT valid_subscription_tier
      CHECK (subscription_tier IN ('free', 'pro', 'studio'));
  END IF;
END;
$$;
