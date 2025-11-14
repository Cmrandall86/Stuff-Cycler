# Deploy Admin Users Edge Function

## Changes Made

### Backend (Edge Function)
1. **Fixed environment variable names**: Now supports both `SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` and the old naming convention
2. **Added comprehensive error logging**: All operations now log success/failure for easier debugging
3. **Added self-demotion protection**: Prevents admins from removing their own admin privileges (backend check)
4. **Removed test comment**: Cleaned up the code

### Frontend
1. **Added current user tracking**: Tracks the logged-in user's ID for self-demotion checks
2. **Added self-demotion guard**: Prevents UI from allowing admins to demote themselves
3. **Disabled role dropdown**: When editing yourself, the role dropdown is disabled if you're an admin
4. **Added warning message**: Shows a warning when trying to edit your own admin account

## Deployment Steps

### Step 1: Link to your Supabase project (if not already done)
```bash
supabase link --project-ref your-project-ref
```

### Step 2: Deploy the edge function
```bash
supabase functions deploy admin-users
```

### Step 3: Set environment variables

The function needs these environment variables:

```bash
supabase secrets set \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_ANON_KEY="your-anon-key" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  ALLOW_ORIGIN="http://localhost:5173"
```

**For production**, also set your production URL:
```bash
supabase secrets set ALLOW_ORIGIN="https://your-production-domain.com"
```

You can find these values in your Supabase Dashboard:
- Go to **Settings** → **API**
- `SUPABASE_URL` = Project URL
- `SUPABASE_ANON_KEY` = anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (⚠️ keep this secret!)

### Step 4: Verify deployment

Check the function logs:
```bash
supabase functions logs admin-users
```

You should see:
```
Edge function starting with env check: { hasUrl: true, hasAnon: true, hasService: true }
```

### Step 5: Test in your app

1. **Test user creation**: Try creating a new user from the admin panel
2. **Test role updates**: Try changing a user's role (not your own)
3. **Test self-demotion protection**: Try to change your own role from admin to member (should be blocked)

## Troubleshooting

### If you get 500 errors:

1. Check the function logs:
   ```bash
   supabase functions logs admin-users
   ```

2. Verify environment variables are set:
   ```bash
   supabase secrets list
   ```

3. Look for error messages in the logs that indicate:
   - Missing environment variables
   - Database permission issues
   - Auth token problems

### Common Issues

**"Cannot read properties of undefined"**
- Environment variables not set correctly
- Solution: Re-run the `supabase secrets set` command

**"Forbidden" or 403 errors**
- User role check failing
- Solution: Verify your profile has `role = 'admin'` in the database

**CORS errors**
- `ALLOW_ORIGIN` not matching your frontend URL
- Solution: Update `ALLOW_ORIGIN` to match your frontend (e.g., `http://localhost:5173`)

## Testing Checklist

- [ ] Create a new user with member role
- [ ] Create a new user with admin role
- [ ] Edit a user's display name
- [ ] Edit a user's role
- [ ] Try to edit your own role (should be blocked)
- [ ] Reset a user's password
- [ ] Soft delete (ban) a user
- [ ] Hard delete a user
- [ ] Search for users by email/name
- [ ] Pagination works correctly

