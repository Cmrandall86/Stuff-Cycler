# Complete Debug Instructions - Step by Step

You're getting 500 errors when loading the feed. Follow these steps IN ORDER to diagnose and fix the issue.

## Step 1: Check Browser Console (DO THIS FIRST!)

1. Open your app in the browser
2. Press **F12** to open DevTools
3. Go to the **Console** tab
4. Refresh the page
5. Look for error messages starting with **❌**

The console will now show you:
- The exact error message from Supabase
- The error code
- Error details and hints

**Copy the error message and check it against common issues below.**

## Step 2: Check Supabase Dashboard Logs

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Logs** → **PostgREST**
4. Look for the failing request to `/rest/v1/items`
5. Click on the error to see the full PostgreSQL error message

**This is the REAL error - not just "500 Internal Server Error"**

## Step 3: Run Diagnostic Queries

In your **Supabase SQL Editor**, run these files in order:

### A. Check Current State
```sql
-- Run: DIAGNOSE-CURRENT-STATE.sql
```

This will show you:
- What RLS policies exist
- Whether the helper function exists
- How much data is in each table
- RLS status on all tables

### B. Test Queries Directly
```sql
-- Run: TEST-ITEMS-QUERY.sql
```

This will test the exact query step by step to find where it fails.

## Step 4: Common Issues & Fixes

### Issue: "infinite recursion detected in policy for relation 'items'"

**Fix**: Run `NUCLEAR-RESET-POLICIES.sql`
- This drops ALL policies and recreates them without recursion
- Test after step 3 (simple policy) before uncommenting step 4

### Issue: "permission denied for table items"

**Possible causes**:
1. RLS is enabled but no policies allow access
2. You're not authenticated
3. No public items exist

**Fix**: 
1. Run `TEMP-DISABLE-RLS.sql` to test if RLS is the problem
2. If it works without RLS, run `NUCLEAR-RESET-POLICIES.sql`

### Issue: "relation 'item_images' does not exist" or "column 'path' does not exist"

**Fix**: 
1. Check if table exists: `SELECT * FROM item_images LIMIT 1;`
2. If it doesn't exist, run `FIX-EVERYTHING.sql`
3. If column names are wrong, check `DIAGNOSE-CURRENT-STATE.sql` output

### Issue: Still getting 500 errors after all fixes

**Last resort**: 
1. Run `TEMP-DISABLE-RLS.sql` to disable RLS temporarily
2. If feed loads, the problem is RLS policies
3. Run `NUCLEAR-RESET-POLICIES.sql` for clean slate
4. If feed STILL doesn't load, the problem is not RLS - check for:
   - Missing tables
   - Wrong column names
   - Corrupted data
   - Database connection issues

## Step 5: The Nuclear Option

If nothing else works:

```sql
-- Run: NUCLEAR-RESET-POLICIES.sql
```

This script:
1. Drops EVERY policy on all tables
2. Creates a simple policy for public + owner items only
3. Tells you to test (DO THIS - don't skip!)
4. Only after testing, uncomment step 4 for group support
5. Recreates all other policies one by one

## Files Created

| File | Purpose |
|------|---------|
| `DIAGNOSE-CURRENT-STATE.sql` | See what's actually in your database |
| `TEST-ITEMS-QUERY.sql` | Test queries step by step |
| `TEMP-DISABLE-RLS.sql` | Temporarily bypass RLS for testing |
| `NUCLEAR-RESET-POLICIES.sql` | Complete reset of all policies |
| `HOW-TO-CHECK-LOGS.md` | How to view Supabase logs |

## Expected Results

After implementing fixes:
✅ Browser console shows: `✅ Feed fetched successfully: X items`
✅ Feed page loads without errors
✅ No infinite recursion errors
✅ RLS properly enforced (can't see other users' private items)

## Still Stuck?

Check the browser console output - it now logs:
- 🔍 When it starts fetching
- ❌ Detailed error information if it fails
- ✅ Success message with item count

The error message will tell you exactly what's wrong!

