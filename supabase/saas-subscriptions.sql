-- Gastito SaaS: Free vs Pro subscriptions
-- Apply on the app database (local or remote gastos DB).

-- Plan fields on the app profile (same UUID as identity principal / JWT pid)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS stats_trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro'));

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_status_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_status_check
  CHECK (plan_status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id
  ON profiles(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- New users get a 12-day stats trial from signup
CREATE OR REPLACE FUNCTION public.set_default_stats_trial()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stats_trial_ends_at IS NULL THEN
    NEW.stats_trial_ends_at := NOW() + INTERVAL '12 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_stats_trial ON profiles;
CREATE TRIGGER trg_profiles_stats_trial
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_stats_trial();

-- Backfill trial for existing free users who never had one
UPDATE profiles
SET stats_trial_ends_at = COALESCE(created_at, NOW()) + INTERVAL '12 days'
WHERE plan = 'free'
  AND stats_trial_ends_at IS NULL;

-- Remove seeded system categories (only user-created categories remain)
DELETE FROM categories WHERE is_system = true;

-- Optional audit of Stripe webhook events (idempotency)
CREATE TABLE IF NOT EXISTS billing_events (
  id              TEXT PRIMARY KEY,
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL,
  processed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
