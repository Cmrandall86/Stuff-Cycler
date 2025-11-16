alter table groups enable row level security;
alter table group_members enable row level security;
alter table items enable row level security;
alter table item_images enable row level security;
alter table item_visibility_groups enable row level security;
alter table interests enable row level security;
alter table reservations enable row level security;
alter table profiles enable row level security;

-- Groups
drop policy if exists "group readable if member or owner" on groups;
drop policy if exists "group insert" on groups;
drop policy if exists "group update by owner" on groups;
drop policy if exists "groups: read mine" on groups;
drop policy if exists "groups: insert self owner" on groups;
drop policy if exists "groups: owner write" on groups;
drop policy if exists "groups: owner delete" on groups;

create policy "groups_select"
on groups for select
using (
  owner_id = auth.uid()
  or exists (
    select 1 from group_members gm
    where gm.group_id = groups.id and gm.user_id = auth.uid()
  )
);

create policy "groups_insert"
on groups for insert
with check ( owner_id = auth.uid() );

create policy "groups_update"
on groups for update using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "groups_delete"
on groups for delete using (owner_id = auth.uid());

-- Group members
drop policy if exists "gm select if self or same group" on group_members;
drop policy if exists "gm insert by group member" on group_members;
drop policy if exists "gm delete by owner or self" on group_members;
drop policy if exists "group_members: read mine" on group_members;
drop policy if exists "group_members: owner can insert" on group_members;
drop policy if exists "group_members: owner can delete" on group_members;

create policy "group_members_select"
on group_members for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from group_members gm2
    where gm2.group_id = group_members.group_id
    and gm2.user_id = auth.uid()
  )
);

create policy "group_members_insert"
on group_members for insert
with check (
  user_id = auth.uid()
  or exists (select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid())
);

create policy "group_members_delete"
on group_members for delete
using (
  (user_id = auth.uid() and not exists (select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid()))
  or
  (exists (select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid()) and user_id <> auth.uid())
);

-- Items (core visibility rule - supports public, owner, and group visibility)
create policy "items_select_policy" on items
for select using (
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
      select 1 from item_visibility_groups iv
      join group_members gm on gm.group_id = iv.group_id
      where iv.item_id = items.id and gm.user_id = auth.uid()
    )
  )
);
create policy "item insert by owner" on items
for insert with check ( owner_id = auth.uid() );
create policy "item update by owner" on items
for update using ( owner_id = auth.uid() );
create policy "item delete by owner" on items
for delete using ( owner_id = auth.uid() );

-- Images inherit from parent item (supports public visibility)
create policy "item_images_select_policy" on item_images
for select using (
  EXISTS (
    select 1 from items i where i.id = item_images.item_id and (
      -- Public items - anyone can see images
      i.visibility = 'public'
      OR
      -- Owner can see their images
      i.owner_id = auth.uid()
      OR
      -- Group members can see group-visible item images
      (
        i.visibility = 'groups'
        AND auth.uid() IS NOT NULL
        AND EXISTS (
          select 1 from item_visibility_groups iv
          join group_members gm on gm.group_id = iv.group_id
          where iv.item_id = i.id and gm.user_id = auth.uid()
        )
      )
    )
  )
);
create policy "item_images_write_owner" on item_images
for all using (
  EXISTS (
    select 1 from items i where i.id = item_images.item_id and i.owner_id = auth.uid()
  )
) with check (
  EXISTS (
    select 1 from items i where i.id = item_images.item_id and i.owner_id = auth.uid()
  )
);

-- Item visibility (simplified to avoid recursion - NO items check in SELECT!)
create policy "ivg_select" on item_visibility_groups
for select using (
  -- You're in the group (that's it - no items check to avoid recursion)
  EXISTS (
    select 1 from group_members gm
    where gm.group_id = item_visibility_groups.group_id
    and gm.user_id = auth.uid()
  )
);
create policy "ivg_write" on item_visibility_groups
for all using (
  EXISTS (
    select 1 from items i 
    where i.id = item_visibility_groups.item_id 
    and i.owner_id = auth.uid()
  )
) with check (
  EXISTS (
    select 1 from items i 
    where i.id = item_visibility_groups.item_id 
    and i.owner_id = auth.uid()
  )
);

-- Interests: insert/select if you can see the item; delete/update by author or item owner
create policy "interest read if related" on interests
for select using (
  EXISTS (
    select 1 from items i where i.id = interests.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility_groups iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  )
);
create policy "interest insert if can see item" on interests
for insert with check (
  EXISTS (
    select 1 from items i where i.id = interests.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility_groups iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  ) AND auth.uid() = interests.user_id
);
create policy "interest update/delete by author or item owner" on interests
for all using (
  auth.uid() = interests.user_id OR EXISTS (select 1 from items i where i.id = interests.item_id and i.owner_id = auth.uid())
);

-- Reservations (owner controls; claimer can read)
create policy "reservation read if related" on reservations
for select using (
  EXISTS (select 1 from items i where i.id = reservations.item_id and (i.owner_id = auth.uid()))
  OR auth.uid() = reservations.claimer_id
);
create policy "reservation write by item owner" on reservations
for all using (
  EXISTS (select 1 from items i where i.id = reservations.item_id and i.owner_id = auth.uid())
) with check (
  EXISTS (select 1 from items i where i.id = reservations.item_id and i.owner_id = auth.uid())
);

-- Profiles
-- anyone can read minimal profile info (ok for MVP)
drop policy if exists "profiles read limited" on profiles;
create policy "profiles read limited"
on profiles for select
using ( true );

-- allow profile creation (for new user signups via edge function)
drop policy if exists "profiles insert for new users" on profiles;
create policy "profiles insert for new users"
on profiles for insert
with check ( true );  -- Service role bypasses RLS anyway

-- users can update only their own profile (not role - blocked by trigger)
drop policy if exists "profiles upsert self" on profiles;
create policy "profiles upsert self"
on profiles for update
using ( auth.uid() = id )
with check ( auth.uid() = id );

-- admins can do anything on profiles (including role changes)
drop policy if exists "profiles admin all" on profiles;
create policy "profiles admin all"
on profiles for all
using ( exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin') )
with check ( exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin') );

