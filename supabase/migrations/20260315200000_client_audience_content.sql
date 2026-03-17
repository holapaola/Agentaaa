-- Add target audience and content style fields to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS target_audience_type TEXT,       -- 'B2B' or 'B2C'
  ADD COLUMN IF NOT EXISTS target_age_range     TEXT,       -- e.g. 'Millennials (25-35)'
  ADD COLUMN IF NOT EXISTS target_description   TEXT,       -- free-text ideal customer
  ADD COLUMN IF NOT EXISTS content_types        TEXT[],     -- e.g. ['Educational','Promotions']
  ADD COLUMN IF NOT EXISTS posting_frequency    TEXT;       -- e.g. '3-4x/week'
