
-- Create post status enum
CREATE TYPE public.post_status AS ENUM ('Researching', 'Drafting', 'Pending_Approval', 'Approved', 'Scheduled');

-- Create agencies table
CREATE TABLE public.agencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own agency" ON public.agencies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own agency" ON public.agencies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own agency" ON public.agencies FOR UPDATE USING (auth.uid() = user_id);

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  website_url TEXT,
  brand_voice TEXT NOT NULL DEFAULT 'Professional',
  industry TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency owners can view their clients" ON public.clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agencies WHERE agencies.id = clients.agency_id AND agencies.user_id = auth.uid())
);
CREATE POLICY "Agency owners can create clients" ON public.clients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.agencies WHERE agencies.id = clients.agency_id AND agencies.user_id = auth.uid())
);
CREATE POLICY "Agency owners can update clients" ON public.clients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.agencies WHERE agencies.id = clients.agency_id AND agencies.user_id = auth.uid())
);
CREATE POLICY "Agency owners can delete clients" ON public.clients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.agencies WHERE agencies.id = clients.agency_id AND agencies.user_id = auth.uid())
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  caption_text TEXT,
  image_url TEXT,
  video_url TEXT,
  ai_visual_prompt TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status post_status NOT NULL DEFAULT 'Researching',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency owners can view their posts" ON public.posts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.clients
    JOIN public.agencies ON agencies.id = clients.agency_id
    WHERE clients.id = posts.client_id AND agencies.user_id = auth.uid()
  )
);
CREATE POLICY "Agency owners can create posts" ON public.posts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    JOIN public.agencies ON agencies.id = clients.agency_id
    WHERE clients.id = posts.client_id AND agencies.user_id = auth.uid()
  )
);
CREATE POLICY "Agency owners can update posts" ON public.posts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.clients
    JOIN public.agencies ON agencies.id = clients.agency_id
    WHERE clients.id = posts.client_id AND agencies.user_id = auth.uid()
  )
);
CREATE POLICY "Agency owners can delete posts" ON public.posts FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.clients
    JOIN public.agencies ON agencies.id = clients.agency_id
    WHERE clients.id = posts.client_id AND agencies.user_id = auth.uid()
  )
);

-- Create trends table
CREATE TABLE public.trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  industry TEXT NOT NULL,
  trend_title TEXT NOT NULL,
  trend_description TEXT,
  source_url TEXT,
  relevance_score NUMERIC DEFAULT 0,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view trends" ON public.trends FOR SELECT TO authenticated USING (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_agencies_updated_at BEFORE UPDATE ON public.agencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
