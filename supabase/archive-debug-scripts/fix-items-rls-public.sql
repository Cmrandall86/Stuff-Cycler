-- Fix: Add support for public item visibility
-- Your items table has a 'visibility' column that can be 'public' or 'groups'
-- But the RLS policy doesn't handle 'public' items!

-- Drop existing item read policy
DROP POLICY IF EXISTS "item read if owner or in visible groups" ON items;

-- Create new policy that handles public visibility
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
    AND EXISTS (
      SELECT 1 FROM item_visibility_groups ivg
      JOIN group_members gm ON gm.group_id = ivg.group_id
      WHERE ivg.item_id = items.id 
      AND gm.user_id = auth.uid()
    )
  )
);

-- Also update item_images policy to handle public items
DROP POLICY IF EXISTS "item_images_select_owner" ON item_images;
DROP POLICY IF EXISTS "image read if can read item" ON item_images;

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

SELECT 'Public visibility support added!' as result;

