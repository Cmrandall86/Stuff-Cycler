# Storage Buckets

## Setup

1. Create bucket `images` (private).
2. Upload flow:
   - Client compresses image (<= 1600px longest side, ~0.8 quality), strips EXIF.
   - Request signed upload URL via Supabase.
   - Store `path` in `item_images`.
3. Download: generate signed URL per image (or proxy via edge function later). Keep bucket private to avoid public scraping.

## Bucket Configuration

- **Name:** `images`
- **Public:** `false` (private)
- **File size limit:** Configure as needed (recommended: 5MB per file)
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`

## Upload Policy

Add an **Anon** upload policy for authenticated users via signed URLs. Users can only upload to their own folders or use a path structure that includes their user ID.

