alter table groups enable row level security;
alter table group_members enable row level security;
alter table items enable row level security;
alter table item_photos enable row level security;
alter table item_visibility enable row level security;
alter table interests enable row level security;
alter table reservations enable row level security;

-- Groups
create policy "group readable if member or owner" on groups
for select using (
  owner_id = auth.uid() OR EXISTS (
    select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid()
  )
);
create policy "group insert" on groups
for insert with check ( auth.uid() = owner_id );
create policy "group update by owner" on groups
for update using ( auth.uid() = owner_id );

-- Group members
create policy "gm select if self or same group" on group_members
for select using (
  user_id = auth.uid() OR EXISTS (
    select 1 from group_members gm2 where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()
  )
);
create policy "gm insert by group member" on group_members
for insert with check (
  EXISTS (
    select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid()
  ) OR auth.uid() = user_id -- self-join via invite code
);
create policy "gm delete by owner or self" on group_members
for delete using (
  EXISTS (select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid())
  OR auth.uid() = user_id
);

-- Items (core visibility rule)
create policy "item read if owner or in visible groups" on items
for select using (
  owner_id = auth.uid() OR EXISTS (
    select 1 from item_visibility iv
    join group_members gm on gm.group_id = iv.group_id
    where iv.item_id = items.id and gm.user_id = auth.uid()
  )
);
create policy "item insert by owner" on items
for insert with check ( owner_id = auth.uid() );
create policy "item update by owner" on items
for update using ( owner_id = auth.uid() );
create policy "item delete by owner" on items
for delete using ( owner_id = auth.uid() );

-- Photos inherit from parent item
create policy "photo read if can read item" on item_photos
for select using (
  EXISTS (
    select 1 from items i where i.id = item_photos.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  )
);
create policy "photo write by owner" on item_photos
for all using (
  EXISTS (
    select 1 from items i where i.id = item_photos.item_id and i.owner_id = auth.uid()
  )
) with check (
  EXISTS (
    select 1 from items i where i.id = item_photos.item_id and i.owner_id = auth.uid()
  )
);

-- Item visibility (owner only)
create policy "visibility read if can read item" on item_visibility
for select using (
  EXISTS (
    select 1 from items i where i.id = item_visibility.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  )
);
create policy "visibility write by owner" on item_visibility
for all using (
  EXISTS (
    select 1 from items i where i.id = item_visibility.item_id and i.owner_id = auth.uid()
  )
) with check (
  EXISTS (
    select 1 from items i where i.id = item_visibility.item_id and i.owner_id = auth.uid()
  )
);

-- Interests: insert/select if you can see the item; delete/update by author or item owner
create policy "interest read if related" on interests
for select using (
  EXISTS (
    select 1 from items i where i.id = interests.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
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
        select 1 from item_visibility iv
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

