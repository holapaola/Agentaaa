-- Create storage bucket for brand assets (photos/videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload brand assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public reads
CREATE POLICY "Brand assets are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'brand-assets');
