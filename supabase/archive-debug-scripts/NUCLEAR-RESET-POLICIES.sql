-- NUCLEAR OPTION: Complete RLS Policy Reset
-- This drops ALL policies and recreates them from scratch, step by step
-- Use this ONLY if all other fixes have failed

-- ============================================================
-- PART 1: Drop ALL existing policies
-- ============================================================

-- Drop all items policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'items'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON items';
    END LOOP;
END $$;

-- Drop all item_images policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'item_images'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON item_images';
    END LOOP;
END $$;

-- Drop all item_visibility_groups policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'item_visibility_groups'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON item_visibility_groups';
    END LOOP;
END $$;

-- Drop all groups policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'groups'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON groups';
    END LOOP;
END $$;

-- Drop all group_members policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'group_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON group_members';
    END LOOP;
END $$;

SELECT '✓ All policies dropped' as status;

-- ============================================================
-- PART 2: Create helper function (NO RLS checks)
-- ============================================================

CREATE OR REPLACE FUNCTION user_in_item_groups(item_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM item_visibility_groups ivg
    INNER JOIN group_members gm ON gm.group_id = ivg.group_id
    WHERE ivg.item_id = item_uuid
    AND gm.user_id = user_uuid
  );
$$;

SELECT '✓ Helper function created' as status;

-- ============================================================
-- PART 3: Create simple items policy FIRST (test this works!)
-- ============================================================

CREATE POLICY "items_select_simple" ON items
FOR SELECT
USING (
  visibility = 'public'
  OR owner_id = auth.uid()
);

SELECT '✓ Simple items SELECT policy created (public + owner only)' as status;
SELECT 'TEST NOW: Try loading your feed. If it works, continue below.' as instruction;

-- ============================================================
-- PART 4: Add group visibility support (ONLY if step 3 works!)
-- ============================================================
-- Uncomment these lines ONLY after testing step 3:

/*
DROP POLICY IF EXISTS "items_select_simple" ON items;

CREATE POLICY "items_select" ON items
FOR SELECT
USING (
  visibility = 'public'
  OR owner_id = auth.uid()
  OR (
    visibility = 'groups'
    AND auth.uid() IS NOT NULL
    AND user_in_item_groups(id, auth.uid())
  )
);

SELECT '✓ Full items SELECT policy with groups support created' as status;
*/

-- ============================================================
-- PART 5: Add items write policies
-- ============================================================

CREATE POLICY "items_insert" ON items
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "items_update" ON items
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "items_delete" ON items
FOR DELETE
USING (owner_id = auth.uid());

SELECT '✓ Items write policies created' as status;

-- ============================================================
-- PART 6: Add item_images policies (simple, inherit from items)
-- ============================================================

CREATE POLICY "item_images_select" ON item_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM items i
    WHERE i.id = item_images.item_id
    AND (
      i.visibility = 'public'
      OR i.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "item_images_write" ON item_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM items i
    WHERE i.id = item_images.item_id
    AND i.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM items i
    WHERE i.id = item_images.item_id
    AND i.owner_id = auth.uid()
  )
);

SELECT '✓ item_images policies created' as status;

-- ============================================================
-- PART 7: Add item_visibility_groups policies (NO items check!)
-- ============================================================

CREATE POLICY "ivg_select" ON item_visibility_groups
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = item_visibility_groups.group_id
    AND gm.user_id = auth.uid()
  )
);

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

SELECT '✓ item_visibility_groups policies created' as status;

-- ============================================================
-- PART 8: Add groups policies
-- ============================================================

CREATE POLICY "groups_select" ON groups
FOR SELECT
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "groups_insert" ON groups
FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups_update" ON groups
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "groups_delete" ON groups
FOR DELETE
USING (owner_id = auth.uid());

SELECT '✓ groups policies created' as status;

-- ============================================================
-- PART 9: Add group_members policies (NO groups check in SELECT!)
-- ============================================================

CREATE POLICY "group_members_select" ON group_members
FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.user_id = auth.uid()
  )
);

CREATE POLICY "group_members_insert" ON group_members
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "group_members_delete" ON group_members
FOR DELETE
USING (
  (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.owner_id = auth.uid()
    )
  )
  OR (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.owner_id = auth.uid()
    )
    AND user_id <> auth.uid()
  )
);

SELECT '✓ group_members policies created' as status;

-- ============================================================
-- FINAL STATUS
-- ============================================================

SELECT '✓✓✓ NUCLEAR RESET COMPLETE ✓✓✓' as status;
SELECT 'All policies have been recreated from scratch' as status;
SELECT 'Test your feed now!' as status;

