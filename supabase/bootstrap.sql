-- Enable extensions
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_invite_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Items
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  condition text,
  category text,
  approx_location text,
  status text not null default 'active',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  path text not null,
  sort_order int not null default 0
);

create table if not exists item_visibility_groups (
  item_id uuid not null references items(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  tier int not null default 1,
  primary key (item_id, group_id)
);

-- Interest & reservations
create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'interested',
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  claimer_id uuid not null references auth.users(id) on delete cascade,
  reserved_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active'
);

-- Indices
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_item_owner on items(owner_id);
create index if not exists idx_item_status on items(status);
create index if not exists idx_interests_item on interests(item_id);
create index if not exists idx_reservations_item on reservations(item_id);

-- PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add avatar_url column if it doesn't exist (for existing tables)
alter table profiles add column if not exists avatar_url text;

create index if not exists idx_profiles_role on profiles(role);

-- helper: are we admin?
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from profiles p where p.id = uid and p.role = 'admin')
$$;

-- block role changes by non-admins (but allow service role)
create or replace function public.profiles_guard_role()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' and new.role is distinct from old.role then
    -- Allow if auth.uid() is NULL (service role) OR if user is admin
    if auth.uid() is not null and not public.is_admin(auth.uid()) then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_role on profiles;
create trigger trg_profiles_guard_role
before update on profiles
for each row execute function public.profiles_guard_role();

-- Auto-create profile for new users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- try various keys providers use
  dn text := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'user_name',
    null
  );
  pic text := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',      -- Google/Discord
    null
  );
  email_local text := split_part(new.email, '@', 1);
begin
  if dn is null or btrim(dn) = '' then
    -- simple "nice" fallback from email local-part
    dn := initcap(regexp_replace(email_local, '[_\.\-]+', ' ', 'g'));
  end if;

  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, dn, pic)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Helper view for current user role
create or replace view my_role as
select role from profiles where id = auth.uid();

-- RPC function for getting current user role (returns text directly)
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role::text from profiles where id = auth.uid();
$$;

-- Grant execute permission
grant execute on function public.get_my_role() to anon, authenticated;

-- Ensure profiles.role exists with proper constraint (idempotent)
alter table profiles
  add column if not exists role text not null default 'member'
  check (role in ('member','admin'));

