-- Add pipeline tracking columns to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS pipeline_status TEXT DEFAULT 'Researching';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS research_notes TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS content_strategy TEXT;

-- Add platform and content pillar to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'Instagram';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS content_pillar TEXT;
