# CORS Fix for Admin Users Edge Function

## Changes Made

1. **Moved OPTIONS handler outside try-catch** - This ensures CORS preflight requests are handled before any other logic that might fail
2. **Improved CORS headers** - Added all necessary headers including `apikey` and `x-client-info` that Supabase might send
3. **Dynamic origin handling** - The OPTIONS handler now:
   - Automatically allows localhost origins
   - Falls back to env var `ALLOW_ORIGIN` if set
   - Uses the requesting origin as a fallback

## Next Steps - Deploy the Function

The Edge Function **must be redeployed** for these changes to take effect:

### Option 1: Using Supabase CLI (Recommended)

```bash
# Make sure you're in the project root
cd supabase/functions/admin-users

# Deploy the function
supabase functions deploy admin-users

# Set environment variables (if not already set)
supabase secrets set PROJECT_URL=your-project-url
supabase secrets set ANON_KEY=your-anon-key
supabase secrets set SERVICE_ROLE=your-service-role-key
supabase secrets set ALLOW_ORIGIN=http://localhost:5173
```

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **admin-users**
3. Click **Deploy** or **Redeploy**
4. Make sure environment variables are set:
   - `PROJECT_URL` - Your Supabase project URL
   - `ANON_KEY` - Your Supabase anon/public key
   - `SERVICE_ROLE` - Your Supabase service role key (keep this secret!)
   - `ALLOW_ORIGIN` - `http://localhost:5173` (or your production URL)

## Verify It Works

After deploying:

1. **Check the function is deployed**: Go to Supabase Dashboard → Edge Functions → admin-users → should show "Deployed"
2. **Test OPTIONS request** in browser console:
   ```javascript
   fetch('https://your-project.supabase.co/functions/v1/admin-users', {
     method: 'OPTIONS',
     headers: {
       'Origin': 'http://localhost:5173'
     }
   }).then(r => {
     console.log('OPTIONS status:', r.status);
     console.log('CORS headers:', {
       'allow-origin': r.headers.get('access-control-allow-origin'),
       'allow-methods': r.headers.get('access-control-allow-methods'),
       'allow-headers': r.headers.get('access-control-allow-headers')
     });
   });
   ```
   Should return status 200 with CORS headers.

3. **Test actual request** (while logged in as admin):
   - Navigate to `/admin/users` in your app
   - Should load without CORS errors
   - Check browser Network tab - OPTIONS request should return 200

## Troubleshooting

### Still getting CORS errors?

1. **Verify function is deployed**: Check Supabase dashboard
2. **Check environment variables**: Make sure all required vars are set
3. **Check function logs**: Supabase Dashboard → Edge Functions → admin-users → Logs
4. **Verify origin matches**: Make sure your frontend URL matches `ALLOW_ORIGIN` env var
5. **Clear browser cache**: Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

### Function not found?

- Make sure the function is named `admin-users` (matches the folder name)
- Check the function path in your frontend matches: `/functions/v1/admin-users`

### Still failing after deployment?

Check the function logs in Supabase dashboard for any errors. The OPTIONS handler should now work even if other parts of the function fail.

