# Image Feature Deployment Checklist

## ✅ Implementation Complete

All image functionality has been successfully implemented and is ready for deployment.

## Pre-Deployment Steps

### 1. Run Database Migration
```bash
cd supabase
supabase db push
```

Or if using the Supabase dashboard:
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/11_storage_policies_images.sql`
3. Execute the SQL

### 2. Verify Storage Bucket

In Supabase Dashboard:
1. Navigate to Storage
2. Confirm `images` bucket exists
3. Verify it's set to **Private** (not public)
4. Check policies are applied (4 policies should show)

### 3. Test Locally

Before deploying, test the following:

#### Desktop Testing
- [ ] Create new item with 1-5 images
- [ ] Images compress and upload successfully
- [ ] Images display in feed card
- [ ] Images display in item detail page
- [ ] Navigate through image gallery (arrows, thumbnails)
- [ ] Edit item and add more images
- [ ] Edit item and remove images
- [ ] Edit item and reorder images (drag-drop)
- [ ] Delete item (verify images are removed from storage)

#### Mobile Testing
- [ ] Tap "Add Images" button
- [ ] Verify "Take Photo" option appears
- [ ] Verify "Choose Photo" option appears
- [ ] Take photo with camera
- [ ] Select photo from library
- [ ] Upload multiple photos
- [ ] View images in gallery
- [ ] Reorder images (touch drag)

### 4. Performance Testing
- [ ] Check image compression is working (images ~0.4MB or less)
- [ ] Verify signed URLs generate quickly
- [ ] Confirm lazy loading works on feed page
- [ ] Test with slow network connection

### 5. Security Testing
- [ ] Unauthenticated users cannot upload images
- [ ] Users cannot delete other users' images
- [ ] Private item images require authentication
- [ ] Public item images are accessible to all authenticated users
- [ ] Group item images only accessible to group members

## Deployment

### Option A: Using Supabase CLI
```bash
# Deploy migration
supabase db push

# Verify deployment
supabase db diff
```

### Option B: Manual Deployment
1. Copy `supabase/migrations/11_storage_policies_images.sql`
2. Go to Supabase Dashboard → SQL Editor
3. Paste and run the migration
4. Verify in Storage → Policies

## Post-Deployment Verification

### 1. Check Storage Setup
```sql
-- Run in SQL Editor to verify bucket and policies
SELECT * FROM storage.buckets WHERE name = 'images';
SELECT * FROM storage.policies WHERE bucket_id = 'images';
```

Expected results:
- 1 bucket named `images` with `public = false`
- 4 policies (insert, select, update, delete)

### 2. Test Image Upload
1. Create a test item with images
2. Check Supabase Storage browser for uploaded files
3. Verify path structure: `items/{item_id}/{timestamp}_0.jpg`
4. Confirm `item_images` table has records

### 3. Verify Signed URLs
1. Open browser DevTools → Network tab
2. View an item with images
3. Check image requests use signed URLs with token
4. Verify URLs expire after 1 hour (optional: wait and refresh)

## Monitoring

After deployment, monitor:
- Storage usage in Supabase dashboard
- Upload success/failure rates
- Signed URL generation performance
- Error logs for image-related issues

## Rollback Plan

If issues occur after deployment:

### Disable Image Uploads
```sql
-- Temporarily disable image uploads
DROP POLICY IF EXISTS "Users can upload images for their own items" ON storage.objects;
```

### Restore Upload Access
```sql
-- Re-enable when issues resolved
-- Run the policy creation from migration file
```

## Configuration

### Storage Limits (Optional)
To set file size limits in Supabase:
1. Storage → Settings
2. Set max file size (recommended: 5MB)
3. Set allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

### CORS (If needed)
If accessing from different domain:
1. Supabase Dashboard → Settings → API
2. Add your domain to CORS allowed origins

## Known Limitations

1. **Image Count**: Max 5 images per item (configurable in `ImageUploader`)
2. **File Size**: Compressed to ~0.4MB (configurable in `lib/image.ts`)
3. **Formats**: Auto-converts to JPEG
4. **URL Expiry**: Signed URLs expire after 1 hour
5. **Mobile Camera**: Requires HTTPS in production

## Support Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Image Compression Library](https://github.com/Donaldcwl/browser-image-compression)
- Implementation details: `docs/IMAGE_IMPLEMENTATION.md`

## Success Criteria

✅ Deployment is successful when:
- [ ] Migration runs without errors
- [ ] Storage bucket and policies exist
- [ ] Users can upload images on web and mobile
- [ ] Images display correctly in feed and detail views
- [ ] Image management (add, remove, reorder) works
- [ ] Mobile camera capture functions properly
- [ ] No unauthorized access to images
- [ ] Performance is acceptable (images load within 2-3 seconds)

