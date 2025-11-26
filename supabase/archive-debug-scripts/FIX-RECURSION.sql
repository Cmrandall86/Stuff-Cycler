-- Fix infinite recursion in RLS policies
-- The problem: items → item_visibility_groups → items → (infinite loop)
-- Solution: Simplify item_visibility_groups policy to not reference items

-- ============================================================
-- Fix item_visibility_groups policy (REMOVE items reference)
-- ============================================================

DROP POLICY IF EXISTS "visibility read if can read item" ON item_visibility_groups;
DROP POLICY IF EXISTS "visibility write by owner" ON item_visibility_groups;

-- Simple read policy: can see visibility rules if you're in the group OR own the item
CREATE POLICY "item_visibility_groups_select" ON item_visibility_groups
FOR SELECT 
USING (
  -- You're a member of the group (or owner of the group)
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = item_visibility_groups.group_id
    AND gm.user_id = auth.uid()
  )
  OR
  -- You own the item
  EXISTS (
    SELECT 1 FROM items i
    WHERE i.id = item_visibility_groups.item_id
    AND i.owner_id = auth.uid()
  )
);

-- Write policy: only item owner can manage visibility
CREATE POLICY "item_visibility_groups_write" ON item_visibility_groups
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
-- Simplify items policy to avoid recursion
-- ============================================================

DROP POLICY IF EXISTS "items_select_policy" ON items;
DROP POLICY IF EXISTS "item read if owner or in visible groups" ON items;

CREATE POLICY "items_select_simple" ON items
FOR SELECT 
USING (
  -- Public items are visible to everyone
  visibility = 'public'
  OR
  -- Owner can see their items
  owner_id = auth.uid()
  OR
  -- If visibility is 'groups', check if user is in any of the item's groups
  (
    visibility = 'groups'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM item_visibility_groups ivg
      INNER JOIN group_members gm ON gm.group_id = ivg.group_id
      WHERE ivg.item_id = items.id
      AND gm.user_id = auth.uid()
    )
  )
);

-- Success!
SELECT '✓ Recursion fixed! RLS policies updated.' as result;

