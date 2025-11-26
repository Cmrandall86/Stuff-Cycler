# Fix 500 Error on Feed

## The Problem

You're seeing errors when trying to load the feed. This is caused by three issues:

1. **Missing/incorrect `item_images` table** - The table doesn't exist or has wrong column names
2. **RLS policies don't support public visibility** - Your items have a `visibility` column that can be 'public' or 'groups', but the RLS policies only handled authenticated group members
3. **Infinite recursion in RLS policies** - The `items` policy checks `item_visibility_groups`, which checks `items` again, creating a loop

## The Solution

### Step 1: Run Diagnostic (Optional)

First, see what's in your database:

```sql
-- Copy and run: supabase/diagnostic-check.sql
```

This will show you what tables exist and their structure.

### Step 2: Run the Fix

**Run this single script in your Supabase SQL Editor:**

```sql
-- Copy and run: supabase/FIX-EVERYTHING.sql
```

This comprehensive script will:
- ✅ Create `item_images` table if needed
- ✅ Enable RLS
- ✅ Update items policy to support public visibility
- ✅ Create item_images policies that support public visibility
- ✅ Fix infinite recursion in item_visibility_groups policy
- ✅ Verify everything worked

### Step 3: Test

After running the fix:

1. Refresh your frontend
2. The feed should load without 500 errors
3. Public items should be visible even without logging in
4. Authenticated users will see their own items + group items

## What Changed

### Items RLS Policy (Before)
```sql
-- Only allowed: owner OR group member
owner_id = auth.uid() OR (group member check)
```

### Items RLS Policy (After)
```sql
-- Now allows: public visibility OR owner OR group member
visibility = 'public' OR owner_id = auth.uid() OR (group member check)
```

### Same fix applied to `item_images` table

This means public items (where `visibility = 'public'`) are now readable by everyone, including unauthenticated users.

### Recursion Fix

**The Problem:** `items` → `item_visibility_groups` → `items` → infinite loop!

**The Solution:** Simplified `item_visibility_groups` SELECT policy to only check if you're in the group, without referencing items table. This breaks the cycle:
```sql
-- OLD (causes recursion):
-- ivg checks if you can read the item → items checks ivg → loop!

-- NEW (no recursion):
-- ivg only checks if you're in the group (via group_members)
EXISTS (SELECT 1 FROM group_members WHERE group_id = X AND user_id = auth.uid())
```

## Files Updated

For future deployments, these files have been updated:
- ✅ `rls-policies.sql` - Updated with public visibility support
- ✅ `bootstrap.sql` - Correct table definitions
- ✅ Frontend types - Using correct `item_images` and `ItemVisibilityGroup`

## Still Having Issues?

If you still see 500 errors after running `FIX-EVERYTHING.sql`:

1. Check the Supabase logs (Dashboard → Logs → PostgREST)
2. Try running `diagnostic-check.sql` to see the actual state
3. Make sure you're using the correct Supabase project

