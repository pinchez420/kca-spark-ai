-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for avatars
-- Allow users to upload their own avatar
CREATE OR REPLACE FUNCTION can_upload_avatar(user_id uuid, bucket_id text)
RETURNS boolean AS $$
BEGIN
  -- Users can only upload to their own folder
  RETURN bucket_id = 'avatars';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Users can upload their own avatar
CREATE POLICY IF NOT EXISTS "Users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name) = auth.uid()::text OR name LIKE auth.uid() || '/%')
);

-- Policy: Users can update their own avatar
CREATE POLICY IF NOT EXISTS "Users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name) = auth.uid()::text OR name LIKE auth.uid() || '/%')
)
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name) = auth.uid()::text OR name LIKE auth.uid() || '/%')
);

-- Policy: Anyone can view avatars (public read)
CREATE POLICY IF NOT EXISTS "Avatars are public"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (bucket_id = 'avatars');
