# Debugging 403 Forbidden Error on Admin Users Edge Function

## Current Status

The frontend shows `role: 'admin'` correctly, but the Edge Function returns 403 Forbidden. This suggests the Edge Function's role check is failing.

## What We've Added

1. **Multiple role check methods** in the Edge Function:
   - Method 1: `get_my_role()` RPC function (same as frontend)
   - Method 2: Direct profile query with user's JWT
   - Method 3: Service role client (bypasses RLS)

2. **Enhanced error logging** - The Edge Function now logs:
   - Which method succeeded/failed
   - The detected role value
   - User ID and email

3. **Detailed error responses** - 403 responses now include:
   - `details`: What role was detected
   - `userId`: The user ID being checked
   - `detectedRole`: The actual role value

4. **Frontend error logging** - Console will show:
   - Full error response from Edge Function
   - Details about what role was detected

## Next Steps

### 1. Redeploy the Edge Function

**CRITICAL**: The Edge Function must be redeployed for these changes to take effect.

```bash
supabase functions deploy admin-users
```

Or via Supabase Dashboard:
- Go to **Edge Functions** → **admin-users**
- Click **Deploy** or **Redeploy**

### 2. Check Edge Function Logs

After redeploying, check the logs in Supabase Dashboard:
- **Edge Functions** → **admin-users** → **Logs**

Look for:
- `"Role check (RPC):"` - Shows if RPC method worked
- `"Role check (direct query):"` - Shows if direct query worked  
- `"Role check (service role):"` - Shows if service role fallback worked
- `"Access denied - not admin:"` - Shows what role was detected

### 3. Check Browser Console

After redeploying, refresh the page and check the browser console. You should now see:
- `"Admin users fetch error:"` - Full error response
- `"403 Forbidden details:"` - What role was detected

### 4. Verify Your Role in Database

Run this SQL in Supabase SQL Editor:

```sql
-- Check your current user's role
SELECT id, email, role, created_at 
FROM profiles 
WHERE id = auth.uid();

-- If role is not 'admin', update it:
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid();

-- Verify the update
SELECT id, email, role 
FROM profiles 
WHERE id = auth.uid();
```

**Important**: Make sure you're updating the profile for the same user ID you're logged in as!

### 5. Verify RPC Function Exists

```sql
-- Check if get_my_role function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_my_role';

-- Test the function (while logged in)
SELECT public.get_my_role() as my_role;
```

### 6. Check RLS Policies

```sql
-- Verify profiles table has read access
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

The `profiles read limited` policy should allow `SELECT` for all users.

## Common Issues

### Issue: Role shows 'admin' in frontend but Edge Function says 'member'

**Possible causes**:
1. **Different user IDs**: Frontend and Edge Function are checking different users
   - **Solution**: Check the `userId` in error response matches your logged-in user

2. **RLS blocking**: RLS policy might be blocking the Edge Function's query
   - **Solution**: The updated Edge Function uses service role fallback to bypass RLS

3. **Function not redeployed**: Old code is still running
   - **Solution**: Redeploy the Edge Function

### Issue: All role check methods fail

**Possible causes**:
1. **Profile doesn't exist**: User has no profile record
   - **Solution**: Check if profile exists: `SELECT * FROM profiles WHERE id = 'YOUR_USER_ID'`

2. **RPC function missing**: `get_my_role()` doesn't exist
   - **Solution**: Run the SQL from `bootstrap.sql` to create the function

3. **Environment variables wrong**: Edge Function can't connect to database
   - **Solution**: Verify `PROJECT_URL`, `ANON_KEY`, `SERVICE_ROLE` are set correctly

## What the Error Response Will Tell You

After redeploying, the 403 error response will include:

```json
{
  "error": "Forbidden",
  "details": "Role is 'member'. Expected 'admin'.",
  "userId": "your-user-id",
  "detectedRole": "member"
}
```

This tells you:
- What role was actually detected
- Which user ID was checked
- That the check succeeded but role was wrong

If you see `"Role is 'null'"`, it means:
- The profile exists but `role` column is NULL
- Or the profile doesn't exist at all

## Testing After Fix

1. Redeploy Edge Function
2. Hard refresh browser (Ctrl+Shift+R)
3. Navigate to `/admin/users`
4. Check browser console for detailed error messages
5. Check Edge Function logs in Supabase Dashboard
6. Compare the detected role with what you expect

