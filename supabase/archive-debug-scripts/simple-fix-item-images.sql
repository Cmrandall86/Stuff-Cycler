-- Simple Fix: Just make sure item_images table exists with correct structure
-- This is a minimal migration focused on getting things working

-- Step 1: Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  path text not null,
  sort_order int not null default 0
);

-- Step 2: Make sure RLS is enabled
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "photo read if can read item" ON item_images;
DROP POLICY IF EXISTS "photo write by owner" ON item_images;
DROP POLICY IF EXISTS "image read if can read item" ON item_images;
DROP POLICY IF EXISTS "image write by owner" ON item_images;

-- Step 4: Create simple read policy (read if you own the item)
-- Start simple - just owner can read their own item images
CREATE POLICY "item_images_select_owner" ON item_images
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM items 
    WHERE items.id = item_images.item_id 
    AND items.owner_id = auth.uid()
  )
);

-- Step 5: Create simple write policy (owner can manage images)
CREATE POLICY "item_images_all_owner" ON item_images
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

-- Success!
SELECT 'item_images table created/updated successfully!' as result;

