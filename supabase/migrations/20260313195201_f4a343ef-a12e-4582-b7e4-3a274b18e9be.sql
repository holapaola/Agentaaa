
-- Add profile_type enum (safe)
DO $$ BEGIN
  CREATE TYPE public.profile_type AS ENUM ('personal', 'agency');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add profile_type column to existing profiles table (safe)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_type public.profile_type NOT NULL DEFAULT 'personal';

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
