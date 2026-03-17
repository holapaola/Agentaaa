-- Update subscription plan enum to match new tiers
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_plan_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_plan_check 
CHECK (subscription_plan IN ('free_trial', 'basic', 'pro', 'enterprise'));

-- Create subscription plan limits table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  monthly_price INTEGER,  -- in cents, NULL = free
  trial_days INTEGER,
  max_clients INTEGER NOT NULL,
  social_slots_per_platform INTEGER NOT NULL,  -- -1 = unlimited
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert plan definitions
INSERT INTO public.subscription_plans (id, name, display_name, monthly_price, trial_days, max_clients, social_slots_per_platform)
VALUES
  ('free_trial', 'Free Trial', 'Free Trial', NULL, 7, 1, 1),
  ('basic', 'Basic', 'Basic - $49/month', 4900, NULL, 5, 2),
  ('pro', 'Pro', 'Pro - $99/month', 9900, NULL, 10, -1),
  ('enterprise', 'Enterprise', 'Enterprise - Custom', NULL, NULL, -1, -1)
ON CONFLICT (id) DO NOTHING;

-- Add trial end date to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Auto-calculate trial_ends_at when subscription_status changes to 'trialing'
CREATE OR REPLACE FUNCTION calculate_trial_end()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_status = 'trialing' AND NEW.trial_started_at IS NULL THEN
    NEW.trial_started_at = NOW();
    NEW.trial_ends_at = NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_trial_dates ON public.profiles;
CREATE TRIGGER set_trial_dates
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_trial_end();
