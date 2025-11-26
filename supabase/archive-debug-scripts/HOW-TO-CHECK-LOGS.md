# How to Check Supabase Logs for Real Error Messages

## Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Logs** in the left sidebar

## Step 2: View PostgREST Logs
1. Click on **PostgREST** logs
2. Look for recent errors (they'll be red/highlighted)
3. Find the request to `/rest/v1/items?select=...`

## Step 3: Find the Real Error
The 500 error response will contain the actual PostgreSQL error message, such as:
- "infinite recursion detected in policy for relation X"
- "permission denied for table X"
- "relation X does not exist"
- "column X does not exist"
- etc.

## Step 4: Copy the Error
Copy the complete error message and paste it back to me so we can fix the actual issue.

## Alternative: Use Supabase Studio SQL Editor
If logs don't show enough detail:
1. Go to **SQL Editor** in Supabase Dashboard
2. Run: `supabase/DIAGNOSE-CURRENT-STATE.sql`
3. This will show you what policies and data actually exist

## What to Look For

### If you see "infinite recursion":
Note which table is mentioned in the error.

### If you see "permission denied":
The RLS policies are blocking the request.

### If you see "relation does not exist":
A table or column name is wrong.

### If you see "column does not exist":
The frontend is querying for a column that doesn't exist in the table.

