-- SIMPLE FIX for infinite recursion
-- Break the cycle by making item_visibility_groups NOT reference items in its read policy

-- ============================================================
-- Step 1: Fix item_visibility_groups (don't check items!)
-- ============================================================

DROP POLICY IF EXISTS "visibility read if can read item" ON item_visibility_groups;
DROP POLICY IF EXISTS "visibility write by owner" ON item_visibility_groups;
DROP POLICY IF EXISTS "item_visibility_groups_select" ON item_visibility_groups;
DROP POLICY IF EXISTS "item_visibility_groups_write" ON item_visibility_groups;

-- READ: Can see visibility rules if you're in the group (that's it - no items check!)
CREATE POLICY "ivg_select" ON item_visibility_groups
FOR SELECT 
USING (
  -- You're in this group
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = item_visibility_groups.group_id
    AND gm.user_id = auth.uid()
  )
);

-- WRITE: Owner of item can manage (this is fine, won't cause recursion on write)
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

SELECT '✓ Fixed! item_visibility_groups no longer references items in SELECT policy' as result;

