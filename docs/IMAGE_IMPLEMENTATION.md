# Image Implementation for Items

## Overview
Successfully implemented comprehensive image functionality for items including upload, display, management, and mobile camera support.

## Features Implemented

### 1. Image Upload & Compression
- **Client-side compression** using `browser-image-compression`
- Images resized to max 1600px, 0.4MB size
- Automatic JPEG conversion
- Mobile camera support via `accept="image/*"` and `capture="environment"` attributes

### 2. Storage & Security
- Private Supabase storage bucket: `images`
- Path structure: `items/{item_id}/{timestamp}_{index}.jpg`
- RLS policies for authenticated users
- Signed URLs with 1-hour expiry for secure access

### 3. Image Management
- **Upload**: Up to 5 images per item
- **Reorder**: Drag-and-drop to change image order
- **Delete**: Remove images during edit
- **Preview**: Real-time preview of selected images
- First image automatically designated as cover photo

### 4. Display
- **Item Detail**: Full image gallery with navigation
  - Large main image view
  - Previous/Next navigation arrows
  - Thumbnail strip for quick navigation
  - Image counter (e.g., "2 / 5")
- **Feed Cards**: Thumbnail of first image with fallback
- Lazy loading for performance

## Files Modified

### Storage & Database
- `supabase/migrations/11_storage_policies_images.sql` - Storage bucket and RLS policies

### API & Types
- `web/src/features/items/api.ts` - Image upload, delete, fetch, reorder functions
- `web/src/features/items/types.ts` - ImageFile and ItemImageWithUrl types

### Components
- `web/src/components/ImageUploader.tsx` - Enhanced with drag-drop reordering
- `web/src/features/items/ItemForm.tsx` - Integrated image management
- `web/src/components/ItemCard.tsx` - Display first image thumbnail
- `web/src/routes/Item.tsx` - Full image gallery display
- `web/src/hooks/useFeed.ts` - Generate signed URLs for feed items

## Usage

### Creating an Item with Images
1. Navigate to "Create Item"
2. Fill in item details
3. Click "Add Images" button
   - **Desktop**: Opens file picker
   - **Mobile**: Shows "Take Photo" or "Choose Photo" options
4. Select/capture up to 5 images
5. Images are automatically compressed
6. Drag images to reorder (first image is cover)
7. Click × to remove unwanted images
8. Submit form - images upload after item is created

### Editing Item Images
1. Navigate to item and click "Edit"
2. Existing images load automatically
3. Add new images (up to 5 total)
4. Remove existing images by clicking ×
5. Reorder images by dragging
6. Submit - changes are saved

### Mobile Camera Support
- On mobile devices, the "Add Images" button automatically provides:
  - **Take Photo**: Opens camera directly
  - **Choose Photo**: Opens photo library
- Works on iOS Safari, Chrome, and Android browsers
- No additional permissions needed (handled by browser)

## Technical Details

### Image Upload Flow
```
User selects image
  ↓
Client-side compression (1600px, 0.4MB, JPEG)
  ↓
Item created/updated
  ↓
Images uploaded to Supabase storage
  ↓
Records created in item_images table
  ↓
Navigate to item detail page
```

### Image Display Flow
```
Fetch item_images from database
  ↓
Generate signed URLs for each image
  ↓
Display with 1-hour cache
  ↓
URLs expire and regenerate on next fetch
```

### Storage Security
- **Bucket**: Private (not publicly accessible)
- **Upload**: Only authenticated users for their own items
- **Read**: Item owners, public items, or group members
- **Delete**: Only item owners
- **Path validation**: Server-side checks in RLS policies

## API Functions

### Upload Images
```typescript
await uploadItemImages(itemId: string, files: File[])
```

### Delete Image
```typescript
const deleteImage = useDeleteImage()
deleteImage.mutate({ imageId, itemId })
```

### Fetch Images with Signed URLs
```typescript
const { data: images } = useItemImages(itemId)
```

### Update Image Order
```typescript
await updateImageOrder(itemId, imageIds)
```

## Migration Required

Before using images in production, run the migration:
```bash
cd supabase
supabase migration up
```

This will:
- Create the `images` storage bucket (if not exists)
- Apply RLS policies for secure access
- Enable authenticated users to upload/manage images

## Browser Compatibility

### Mobile Camera Capture
- ✅ iOS Safari 14+
- ✅ Chrome for Android
- ✅ Samsung Internet
- ✅ Firefox Mobile

### Image Features
- ✅ Drag-and-drop reordering (desktop)
- ✅ Touch-based reordering (mobile)
- ✅ Lazy loading
- ✅ Responsive layout

## Future Enhancements

Potential improvements for later:
- Image cropping before upload
- Multiple selection on mobile gallery
- Video support
- Image filters/editing
- Bulk delete
- Image zoom on detail page
- Progressive image loading
- WebP format support

## Troubleshooting

### Images not uploading
1. Check Supabase storage bucket exists
2. Verify migration ran successfully
3. Check browser console for errors
4. Ensure user is authenticated

### Images not displaying
1. Check signed URL generation in console
2. Verify storage RLS policies are correct
3. Ensure image paths are correct in database
4. Check 1-hour URL expiry hasn't passed

### Mobile camera not working
1. Verify browser supports `capture` attribute
2. Check HTTPS connection (required for camera)
3. Ensure site has camera permissions
4. Try different browser if issues persist

## Performance Considerations

- **Compression**: Reduces upload time and storage costs
- **Signed URLs**: Cached for 1 hour to reduce API calls
- **Lazy Loading**: Images load as they appear in viewport
- **Thumbnail Generation**: Only first image loaded in feed
- **Batch Operations**: Multiple images uploaded in parallel

