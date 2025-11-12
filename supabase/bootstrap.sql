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

create table if not exists item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table if not exists item_visibility (
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

