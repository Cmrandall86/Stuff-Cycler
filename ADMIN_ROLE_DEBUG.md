# Admin Role Debugging Guide

## Changes Made

1. **Created `get_my_role` RPC function** in `supabase/bootstrap.sql`
   - This function returns the current user's role as text
   - Grants execute permission to `anon` and `authenticated` roles
   - Run this SQL in your Supabase SQL editor if you haven't already

2. **Added debugging logs** to:
   - `Navbar.tsx` - logs user, role, isLoading, error, and isAdmin
   - `AdminGate.tsx` - logs user, role, loading states, and redirect reasons
   - `useRole.ts` - logs fetched role and any RPC errors

3. **Improved role fetching**:
   - Added `refetchOnMount: 'always'` to force refetch when component mounts
   - Added error logging for RPC calls
   - Simplified `isAdmin` check in Navbar (removed redundant `!!user` check)

## Next Steps

### 1. Run the SQL in Supabase

Execute this in your Supabase SQL Editor:

```sql
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
```

### 2. Test the RPC in Browser Console

While logged in, open DevTools Console. The console logs from `useRole` should show the role being fetched. 

Alternatively, you can test directly in Supabase SQL Editor (while logged in to your app):

```sql
-- This will show your current role
SELECT public.get_my_role() as my_role;

-- Or check the view
SELECT * FROM my_role;
```

**Expected**: Should return `'admin'` or `'member'`

**If you get an error**:
- Make sure you ran the SQL from step 1
- Check that you're logged in
- Verify the function exists: `SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_my_role';`
- Check RLS policies allow reading profiles

### 3. Check Console Logs

Open your browser console and look for:

- `Navbar role debug` - Should show `{ user: true, role: 'admin', isLoading: false, error: null, isAdmin: true }`
- `useRole fetched` - Should show the role being fetched
- `AdminGate debug` - Should show role when accessing `/admin/users`

### 4. Verify Your Role in Database

Make sure you promoted the correct user:

```sql
-- Check your current user ID (run this in SQL editor while logged in)
SELECT auth.uid() as my_user_id;

-- Update your role (replace USER_UUID with the ID from above)
UPDATE profiles SET role = 'admin' WHERE id = 'USER_UUID';

-- Verify it worked
SELECT id, email, role FROM profiles WHERE id = auth.uid();
```

### 5. Clear Cache and Test

After promoting yourself to admin:

1. **Sign out** → **Sign in** (this will clear React Query cache)
2. Or do a **hard reload** (Ctrl+F5 / Cmd+Shift+R)
3. Check the console logs - you should see `role: 'admin'`
4. The Admin link should appear in the navbar

### 6. Test Direct Navigation

Even if the link doesn't show, try navigating directly to `/admin/users` in the address bar:

- **If it loads**: Route/gate works, issue is just Navbar visibility
- **If redirected to `/`**: Check `AdminGate debug` logs - role is probably not 'admin'
- **If redirected to `/signin`**: Not authenticated

## Common Issues

### Issue: RPC function doesn't exist
**Solution**: Run the SQL from step 1 in Supabase SQL Editor

### Issue: Role is null or undefined
**Solution**: 
- Check that `profiles.role` column exists and has a value
- Verify you're querying the correct user ID
- Check RLS policies allow reading profiles

### Issue: Role shows "member" even after updating DB
**Solution**:
- Sign out and sign back in (clears React Query cache)
- Check you updated the correct user ID
- Verify the role value is exactly `'admin'` (lowercase, no quotes in DB)

### Issue: Admin link doesn't show but route works
**Solution**: Check `Navbar role debug` logs - if `role` is `'admin'` but `isAdmin` is `false`, there's a logic issue

### Issue: Multiple Supabase clients
**Solution**: Ensure `window.supabase` and your imported `supabase` are the same instance. Check your `supabaseClient.ts` exports.

## Removing Debug Logs

Once everything works, remove the `console.log` statements from:
- `web/src/components/Navbar.tsx` (line 12)
- `web/src/components/AdminGate.tsx` (lines 10, 17)
- `web/src/hooks/useRole.ts` (lines 15, 19)

