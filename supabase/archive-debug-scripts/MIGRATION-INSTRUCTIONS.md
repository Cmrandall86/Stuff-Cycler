# Item Photos to Item Images Migration

## What was changed

The codebase has been updated from `item_photos` (with `storage_path` column) to `item_images` (with `path` column).

### Frontend Changes (Already Complete ✅)
- ✅ Updated `ItemCard.tsx` to use `ItemImage` type and `item_images` field
- ✅ Updated type imports to use `ItemImage` instead of `ItemPhoto`
- ✅ Changed `storage_path` references to `path`
- ✅ All queries now use `item_images` and `path`

### Database Schema Files Updated (For Future Deployments ✅)
- ✅ `bootstrap.sql` - Updated table definition
- ✅ `rls-policies.sql` - Updated RLS policies
- ✅ `storage-buckets.md` - Updated documentation

## Required Action: Run Database Migration

### Step 1: Check what tables exist

First, run this in your Supabase SQL Editor:

```sql
-- Copy contents of check-tables.sql
SELECT 
    table_name,
    column_name,
    data_type
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name LIKE 'item%'
ORDER BY 
    table_name, ordinal_position;
```

This will show you what item-related tables and columns exist.

### Step 2: Run the Safe Migration

Use the **safe migration** that handles all scenarios:

1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the contents of **`migration-item-images-safe.sql`**
3. Click "Run"

This migration is smart and will:
- ✅ Create `item_images` table if it doesn't exist
- ✅ Rename `item_photos` to `item_images` if it exists
- ✅ Rename `storage_path` column to `path` if needed
- ✅ Set up correct RLS policies
- ✅ Handle any combination of existing/missing tables

### Step 3: Verify

After running the migration, verify it worked:

```sql
-- Check table exists and see its structure
SELECT * FROM item_images LIMIT 1;

-- Check RLS policies are in place
SELECT * FROM pg_policies WHERE tablename = 'item_images';
```

## After Migration

Your frontend will immediately start working with the feed and item images once the migration is applied.

## Common Scenarios

**"item_photos does not exist"** → The safe migration will create `item_images` from scratch ✅

**"item_images already exists"** → The safe migration will update the column names if needed ✅

**"column storage_path exists"** → The safe migration will rename it to `path` ✅

**"item_visibility does not exist"** → Fixed! The migration now correctly references `item_visibility_groups` ✅

## What Was Fixed

The codebase had a mismatch between table names:
- **Your Database:** `item_visibility_groups` (correct ✅)
- **Old Migration/Policies:** `item_visibility` (incorrect ❌)

All files have been updated to use `item_visibility_groups`:
- ✅ `migration-item-images-safe.sql` 
- ✅ `bootstrap.sql`
- ✅ `rls-policies.sql`
- ✅ Frontend types (`ItemVisibilityGroup`)

