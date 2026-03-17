-- Seed test user subscription levels
UPDATE public.profiles SET
  subscription_status = 'inactive',
  subscription_plan = NULL
WHERE id = '7235787c-7663-4e63-a781-c0ae8a3e8976'; -- free@agentaaa.com

UPDATE public.profiles SET
  subscription_status = 'active',
  subscription_plan = 'starter',
  subscription_updated_at = now()
WHERE id = '6b5a1dd8-8b79-435d-95a3-bb8fb7e2819c'; -- basic@agentaaa.com

UPDATE public.profiles SET
  subscription_status = 'active',
  subscription_plan = 'enterprise',
  subscription_updated_at = now()
WHERE id = '9c3ad327-36ca-4df7-86a3-d1a813b00dfc'; -- premium@agentaaa.com
