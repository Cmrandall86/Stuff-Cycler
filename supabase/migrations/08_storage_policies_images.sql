-- ============================================================
-- Migration: Storage policies for images bucket
-- ============================================================
-- Purpose: Allow public read and user-specific write access
-- Note: This is optional if images bucket already has policies
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "images_user_write" ON storage.objects;
DROP POLICY IF EXISTS "images_user_update" ON storage.objects;
DROP POLICY IF EXISTS "images_user_delete" ON storage.objects;
DROP POLICY IF EXISTS "images_user_update_delete" ON storage.objects;

-- Public read for all images (adjust based on your privacy needs)
CREATE POLICY "images_public_read" ON storage.objects 
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'images');

-- Users can upload files under user/{auth.uid()}/ path
CREATE POLICY "images_user_write" ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'user'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can update their own files
CREATE POLICY "images_user_update" ON storage.objects 
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'user'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can delete their own files
CREATE POLICY "images_user_delete" ON storage.objects 
FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
  AND (storage.foldername(name))[1] = 'user'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ✓ Storage policies for images bucket created
SELECT '✓ Storage policies for images bucket created' AS status;

