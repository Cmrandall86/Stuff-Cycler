# Stuff Cycler

## Prereqs
- Node 20+
- pnpm (or npm/yarn)
- Supabase project (free tier is fine)

## Setup
1. Clone this repo.
2. Copy `.env.local.example` to `web/.env.local` and fill values.
3. In Supabase SQL editor, run the contents of `supabase/bootstrap.sql` then `supabase/rls-policies.sql`.
   - If you have existing profiles, also run `supabase/backfill-profiles.sql` to populate display_name and avatar_url for existing users.
4. In Supabase **Storage**, create bucket `images` (public = false). Add an **Anon** upload policy for authenticated users via signed URLs.
5. Configure authentication providers in Supabase Dashboard:
   - Go to **Authentication → Providers**
   - Enable **Email** provider:
     - Check "Enable email confirmations" if you want email verification (recommended for production)
     - For development, you can disable this to allow immediate login after signup
     - Allow password signups
   - Enable **Google** provider and configure client ID/secret
   - Enable **Discord** provider and configure client ID/secret
   - In **URL Configuration**:
     - Set **Site URL** to: `http://localhost:5173`
     - Add **Redirect URLs**: 
       - `http://localhost:5173`
       - `http://localhost:5173/*`
   - Enable **Email → Templates → Reset password** template
   
   **Note:** If email confirmation is enabled, users must confirm their email before they can sign in. Check your Supabase project settings under Authentication → Settings.
6. Deploy Edge Function for admin user management:
   ```bash
   supabase functions deploy admin-users
   supabase functions secrets set SUPABASE_URL=your-url SUPABASE_ANON_KEY=your-anon-key SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   Or use an env file:
   ```bash
   supabase functions secrets set --env-file supabase/.env
   ```
7. Promote your user to admin (run in Supabase SQL editor while logged in):
   ```sql
   update profiles set role='admin' where id = auth.uid();
   ```
8. Install deps & run:
   ```bash
   cd web
   pnpm i
   pnpm dev
   ```

## Testing Checklist

- [ ] Email/password sign-up creates profile automatically
- [ ] Sign in/out flows work correctly
- [ ] Google and Discord sign-in create profile rows with display_name
- [ ] Non-admin cannot access `/admin/users` (redirects to home)
- [ ] Admin can list users, create user, edit role, reset password, delete/ban
- [ ] Password reset flow: email link → `/reset-password` → update password → redirect to sign-in
- [ ] RLS policies remain intact for app data

## Dev URLs
- Vite dev server: http://localhost:5173
- Supabase dashboard: https://app.supabase.com

