# Stuff Cycler

## Prereqs
- Node 20+
- pnpm (or npm/yarn)
- Supabase project (free tier is fine)

## Setup
1. Clone this repo.
2. Copy `.env.local.example` to `web/.env.local` and fill values.
3. In Supabase SQL editor, run the contents of `supabase/bootstrap.sql` then `supabase/rls-policies.sql`.
4. In Supabase **Storage**, create bucket `images` (public = false). Add an **Anon** upload policy for authenticated users via signed URLs.
5. Install deps & run:
   ```bash
   cd web
   pnpm i
   pnpm dev
   ```

## Dev URLs
- Vite dev server: http://localhost:5173
- Supabase dashboard: https://app.supabase.com

