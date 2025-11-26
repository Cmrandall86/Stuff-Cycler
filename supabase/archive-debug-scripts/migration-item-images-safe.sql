-- Safe migration: Handles multiple scenarios for item images table
-- This checks what exists and migrates accordingly

-- Scenario 1: If item_photos exists, rename it to item_images
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'item_photos') THEN
        -- Drop old policies first
        DROP POLICY IF EXISTS "photo read if can read item" ON item_photos;
        DROP POLICY IF EXISTS "photo write by owner" ON item_photos;
        
        -- Rename table
        ALTER TABLE item_photos RENAME TO item_images;
        
        -- Rename column if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'item_images' AND column_name = 'storage_path') THEN
            ALTER TABLE item_images RENAME COLUMN storage_path TO path;
        END IF;
        
        RAISE NOTICE 'Renamed item_photos to item_images';
    END IF;
END $$;

-- Scenario 2: If item_images doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  path text not null,
  sort_order int not null default 0
);

-- Scenario 3: If item_images exists but has storage_path column, rename it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'item_images' AND column_name = 'storage_path') THEN
        ALTER TABLE item_images RENAME COLUMN storage_path TO path;
        RAISE NOTICE 'Renamed storage_path column to path';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE item_images ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (with both possible names)
DROP POLICY IF EXISTS "photo read if can read item" ON item_images;
DROP POLICY IF EXISTS "photo write by owner" ON item_images;
DROP POLICY IF EXISTS "image read if can read item" ON item_images;
DROP POLICY IF EXISTS "image write by owner" ON item_images;

-- Create policies with new names
CREATE POLICY "image read if can read item" ON item_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM items i WHERE i.id = item_images.item_id AND (
      i.owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM item_visibility_groups iv
        JOIN group_members gm ON gm.group_id = iv.group_id
        WHERE iv.item_id = i.id AND gm.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "image write by owner" ON item_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM items i WHERE i.id = item_images.item_id AND i.owner_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM items i WHERE i.id = item_images.item_id AND i.owner_id = auth.uid()
  )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
END $$;

