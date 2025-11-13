-- Backfill existing profiles with display_name and avatar_url
-- Run this once after updating the trigger

-- Backfill display_name from email local-part for empty/null values
update profiles p
set display_name = initcap(regexp_replace(split_part(u.email,'@',1), '[_\.\-]+', ' ', 'g')),
    updated_at = now()
from auth.users u
where p.id = u.id
  and (p.display_name is null or p.display_name = '' or p.display_name ilike 'empty');

-- Backfill avatar_url from OAuth metadata
update profiles p
set avatar_url = coalesce(
  u.raw_user_meta_data->>'avatar_url',
  u.raw_user_meta_data->>'picture',
  p.avatar_url
),
    updated_at = now()
from auth.users u
where p.id = u.id
  and p.avatar_url is null;

-- Optional: Gravatar fallback for email+password users
-- Uncomment if you want default avatars for all users without avatars
/*
update profiles p
set avatar_url = 'https://www.gravatar.com/avatar/' ||
                 encode(digest(lower(u.email), 'md5'), 'hex') || '?d=identicon&s=128',
    updated_at = now()
from auth.users u
where p.id = u.id
  and (p.avatar_url is null or p.avatar_url = '');
*/

