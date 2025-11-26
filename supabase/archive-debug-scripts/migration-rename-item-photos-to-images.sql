-- DEPRECATED: Use migration-item-images-safe.sql instead
-- This migration is kept for reference only

-- Migration: Rename item_photos to item_images and storage_path to path
-- Run this in your Supabase SQL editor

-- Step 1: Drop existing policies (they reference the old table name)
drop policy if exists "photo read if can read item" on item_photos;
drop policy if exists "photo write by owner" on item_photos;

-- Step 2: Rename the table
alter table item_photos rename to item_images;

-- Step 3: Rename the column
alter table item_images rename column storage_path to path;

-- Step 4: Recreate RLS policies with new table name
create policy "image read if can read item" on item_images
for select using (
  EXISTS (
    select 1 from items i where i.id = item_images.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  )
);

create policy "image write by owner" on item_images
for all using (
  EXISTS (
    select 1 from items i where i.id = item_images.item_id and i.owner_id = auth.uid()
  )
) with check (
  EXISTS (
    select 1 from items i where i.id = item_images.item_id and i.owner_id = auth.uid()
  )
);

