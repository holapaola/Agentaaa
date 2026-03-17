-- Add platforms and campaign goal to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{}';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS campaign_goal TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS business_description TEXT;
