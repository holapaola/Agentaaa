-- Add max_scheduled_posts to subscription plans
ALTER TABLE public.subscription_plans
ADD COLUMN IF NOT EXISTS max_scheduled_posts INTEGER DEFAULT -1;  -- -1 = unlimited

-- Update existing plans
UPDATE public.subscription_plans 
SET max_scheduled_posts = 10 
WHERE id = 'free_trial';

UPDATE public.subscription_plans 
SET max_scheduled_posts = -1 
WHERE id IN ('basic', 'pro', 'enterprise');
