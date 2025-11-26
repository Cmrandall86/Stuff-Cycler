-- Storage policies for item images
-- Bucket: images (should be private)

-- Create the images bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do nothing;

-- Policy: Users can upload images for their own items
create policy "Users can upload images for their own items"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = 'items'
  and exists (
    select 1 from items
    where items.id::text = (storage.foldername(name))[2]
    and items.owner_id = auth.uid()
  )
);

-- Policy: Users can read images for items they have access to
create policy "Users can read item images they have access to"
on storage.objects for select
to authenticated
using (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = 'items'
  and (
    -- User owns the item
    exists (
      select 1 from items
      where items.id::text = (storage.foldername(name))[2]
      and items.owner_id = auth.uid()
    )
    -- OR item is public
    or exists (
      select 1 from items
      where items.id::text = (storage.foldername(name))[2]
      and items.visibility = 'public'
    )
    -- OR user is member of a group that can see the item
    or exists (
      select 1 from items
      join item_visibility_groups ivg on ivg.item_id = items.id
      join group_members gm on gm.group_id = ivg.group_id
      where items.id::text = (storage.foldername(name))[2]
      and gm.user_id = auth.uid()
    )
  )
);

-- Policy: Users can update images for their own items
create policy "Users can update images for their own items"
on storage.objects for update
to authenticated
using (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = 'items'
  and exists (
    select 1 from items
    where items.id::text = (storage.foldername(name))[2]
    and items.owner_id = auth.uid()
  )
);

-- Policy: Users can delete images for their own items
create policy "Users can delete images for their own items"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'images'
  and (storage.foldername(name))[1] = 'items'
  and exists (
    select 1 from items
    where items.id::text = (storage.foldername(name))[2]
    and items.owner_id = auth.uid()
  )
);

