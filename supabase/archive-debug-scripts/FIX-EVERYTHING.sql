-- COMPREHENSIVE FIX: Run this to fix all item_images and visibility issues
-- This combines all necessary fixes into one script

-- ============================================================
-- PART 1: Fix item_images table
-- ============================================================

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  path text not null,
  sort_order int not null default 0
);

-- Enable RLS
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 2: Fix items RLS policy (add public visibility support)
-- ============================================================

-- Drop old items read policy
DROP POLICY IF EXISTS "item read if owner or in visible groups" ON items;
DROP POLICY IF EXISTS "items_select_policy" ON items;

-- Create new policy that handles public items
CREATE POLICY "items_select_policy" ON items
FOR SELECT 
USING (
  -- Public items are visible to everyone (even unauthenticated)
  visibility = 'public'
  OR
  -- Owner can always see their items
  owner_id = auth.uid()
  OR
  -- Group members can see group-visible items
  (
    visibility = 'groups' 
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM item_visibility_groups ivg
      JOIN group_members gm ON gm.group_id = ivg.group_id
      WHERE ivg.item_id = items.id 
      AND gm.user_id = auth.uid()
    )
  )
);

-- ============================================================
-- PART 3: Fix item_images RLS policies
-- ============================================================

-- Drop all existing item_images policies
DROP POLICY IF EXISTS "photo read if can read item" ON item_images;
DROP POLICY IF EXISTS "photo write by owner" ON item_images;
DROP POLICY IF EXISTS "image read if can read item" ON item_images;
DROP POLICY IF EXISTS "image write by owner" ON item_images;
DROP POLICY IF EXISTS "item_images_select_owner" ON item_images;
DROP POLICY IF EXISTS "item_images_all_owner" ON item_images;
DROP POLICY IF EXISTS "item_images_select_policy" ON item_images;
DROP POLICY IF EXISTS "item_images_write_owner" ON item_images;

-- Create SELECT policy for item_images (supports public visibility)
CREATE POLICY "item_images_select_policy" ON item_images
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM items 
    WHERE items.id = item_images.item_id 
    AND (
      -- Public items - anyone can see images
      items.visibility = 'public'
      OR
      -- Owner can see their images
      items.owner_id = auth.uid()
      OR
      -- Group members can see group-visible item images
      (
        items.visibility = 'groups'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM item_visibility_groups ivg
          JOIN group_members gm ON gm.group_id = ivg.group_id
          WHERE ivg.item_id = items.id 
          AND gm.user_id = auth.uid()
        )
      )
    )
  )
);

-- Create write policy for item_images (owner only)
CREATE POLICY "item_images_write_owner" ON item_images
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM items 
    WHERE items.id = item_images.item_id 
    AND items.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM items 
    WHERE items.id = item_images.item_id 
    AND items.owner_id = auth.uid()
  )
);

-- ============================================================
-- PART 4: Fix item_visibility_groups to avoid recursion
-- ============================================================

DROP POLICY IF EXISTS "visibility read if can read item" ON item_visibility_groups;
DROP POLICY IF EXISTS "visibility write by owner" ON item_visibility_groups;
DROP POLICY IF EXISTS "item_visibility_groups_select" ON item_visibility_groups;
DROP POLICY IF EXISTS "item_visibility_groups_write" ON item_visibility_groups;
DROP POLICY IF EXISTS "ivg_select" ON item_visibility_groups;
DROP POLICY IF EXISTS "ivg_write" ON item_visibility_groups;

-- READ: Can see visibility rules if you're in the group (NO items check!)
CREATE POLICY "ivg_select" ON item_visibility_groups
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = item_visibility_groups.group_id
    AND gm.user_id = auth.uid()
  )
);

-- WRITE: Owner can manage
CREATE POLICY "ivg_write" ON item_visibility_groups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM items i
    WHERE i.id = item_visibility_groups.item_id
    AND i.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM items i
    WHERE i.id = item_visibility_groups.item_id
    AND i.owner_id = auth.uid()
  )
);

-- ============================================================
-- PART 5: Verify everything worked
-- ============================================================

-- Check table exists
SELECT 'Table check:' as step, 
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'item_images'
       ) THEN '✓ item_images table exists' 
       ELSE '✗ item_images table missing' 
       END as result;

-- Check RLS enabled
SELECT 'RLS check:' as step,
       CASE WHEN rowsecurity THEN '✓ RLS enabled' 
       ELSE '✗ RLS not enabled' 
       END as result
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'item_images';

-- Check policies exist
SELECT 'Policy check:' as step,
       COUNT(*)::text || ' policies created' as result
FROM pg_policies
WHERE tablename = 'item_images';

-- Final success message
SELECT '✓ ALL FIXES APPLIED SUCCESSFULLY!' as result;

