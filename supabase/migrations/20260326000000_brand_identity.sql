-- Add brand identity columns extracted from website by Agent 1
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_primary_color TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_secondary_color TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_accent_color TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_visual_style TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_personality_tags TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_notes TEXT;
