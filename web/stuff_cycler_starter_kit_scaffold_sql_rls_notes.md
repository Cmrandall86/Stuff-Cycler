# Stuff Cycler – Starter Kit

This document gives you a ready-to-run MVP scaffold: project layout, initial SQL + RLS, UI theme tokens (cool greens on near-black), and build notes you can paste straight into Cursor. It’s written to be copy/paste friendly and to serve as living docs.

---

## 0) Name & mission
**App name:** Stuff Cycler  
**Tagline (internal):** Share useful things with the people you trust, widen when you choose.

---

## 1) Repo layout (proposed)
```
stuff-cycler/
├─ README.md
├─ .env.local.example
├─ supabase/
│  ├─ bootstrap.sql           # Tables + indexes
│  ├─ rls-policies.sql        # RLS policies
│  └─ storage-buckets.md      # Buckets & upload rules
├─ web/
│  ├─ index.html
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vite.config.ts
│  ├─ postcss.config.cjs
│  ├─ tailwind.config.ts
│  ├─ src/
│  │  ├─ main.tsx
│  │  ├─ app.css
│  │  ├─ lib/
│  │  │  ├─ supabaseClient.ts
│  │  │  ├─ image.ts          # compression utils
│  │  │  └─ types.ts
│  │  ├─ routes/
│  │  │  ├─ Root.tsx
│  │  │  ├─ AuthGate.tsx
│  │  │  ├─ Feed.tsx
│  │  │  ├─ Item.tsx
│  │  │  ├─ NewItem.tsx
│  │  │  └─ Groups.tsx
│  │  ├─ components/
│  │  │  ├─ ui/ (atoms: Button, Card, Input, Modal, Badge)
│  │  │  ├─ Navbar.tsx
│  │  │  ├─ ItemCard.tsx
│  │  │  └─ ImageUploader.tsx
│  │  ├─ hooks/
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useFeed.ts
│  │  │  └─ useGroups.ts
│  │  ├─ theme/
│  │  │  ├─ tokens.css        # CSS vars for colors/spacing
│  │  │  └─ README.md
│  │  └─ mcp/
│  │     └─ PLAN.md           # MCP integration plan
└─ ops/
   ├─ deploy-notes.md
   └─ TODOs.md
```

---

## 2) Quickstart (README.md snippet)
```md
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

```

---

## 3) Environment sample (.env.local.example)
```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY

# App
VITE_APP_NAME="Stuff Cycler"
VITE_IMAGE_BUCKET="images"
```

---

## 4) Package.json (web/package.json)
```json
{
  "name": "stuff-cycler-web",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tanstack/react-query": "^5.51.1",
    "@tanstack/react-router": "^1.58.7",
    "browser-image-compression": "^2.0.2",
    "date-fns": "^3.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zod": "^3.23.8",
    "@supabase/supabase-js": "^2.45.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5",
    "vite": "^5.2.0"
  }
}
```

---

## 5) Tailwind + Theme Tokens
**Tailwind config (web/tailwind.config.ts)**
```ts
import type { Config } from 'tailwindcss'
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          900: "#0b0d0e", // near-black
          800: "#121416",
          700: "#1a1d1f",
          600: "#24282a",
        },
        ink: {
          400: "#cfd3d6",
          500: "#aab0b4",
          600: "#8a9094"
        },
        mint: {
          300: "#75d0a6", // cool green accents
          400: "#49be8b",
          500: "#2ea272",
          600: "#23835c"
        }
      },
      borderRadius: { '2xl': '1.25rem' }
    }
  },
  plugins: []
} satisfies Config
```

**tokens.css (web/src/theme/tokens.css)**
```css
:root {
  --bg: #0b0d0e;        /* base-900 */
  --panel: #121416;     /* base-800 */
  --panel-2: #1a1d1f;   /* base-700 */
  --text: #cfd3d6;      /* ink-400 */
  --muted: #8a9094;     /* ink-600 */
  --accent: #49be8b;    /* mint-400 */
  --accent-strong: #23835c; /* mint-600 */
  --radius: 1.25rem;    /* 2xl */
}
```

**app.css (web/src/app.css)**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { background: var(--bg); color: var(--text); }
.card { background: var(--panel); border-radius: var(--radius); }
.btn { border-radius: var(--radius); }
.btn-accent { background: var(--accent); }
.btn-accent:hover { background: var(--accent-strong); }
```

---

## 6) Supabase Bootstrap SQL (supabase/bootstrap.sql)
> Run this first in Supabase SQL editor.
```sql
-- Enable extensions
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Groups
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_invite_only boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists group_members (
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- Items
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  condition text,
  category text,
  approx_location text,
  status text not null default 'active',
  publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0
);

create table if not exists item_visibility (
  item_id uuid not null references items(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  tier int not null default 1,
  primary key (item_id, group_id)
);

-- Interest & reservations
create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state text not null default 'interested',
  created_at timestamptz not null default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id) on delete cascade,
  claimer_id uuid not null references auth.users(id) on delete cascade,
  reserved_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active'
);

-- Indices
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_item_owner on items(owner_id);
create index if not exists idx_item_status on items(status);
create index if not exists idx_interests_item on interests(item_id);
create index if not exists idx_reservations_item on reservations(item_id);
```

---

## 7) RLS Policies (supabase/rls-policies.sql)
> Run second. (Tight, but practical.)
```sql
alter table groups enable row level security;
alter table group_members enable row level security;
alter table items enable row level security;
alter table item_photos enable row level security;
alter table item_visibility enable row level security;
alter table interests enable row level security;
alter table reservations enable row level security;

-- Groups
create policy "group readable if member or owner" on groups
for select using (
  owner_id = auth.uid() OR EXISTS (
    select 1 from group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid()
  )
);
create policy "group insert" on groups
for insert with check ( auth.uid() = owner_id );
create policy "group update by owner" on groups
for update using ( auth.uid() = owner_id );

-- Group members
create policy "gm select if self or same group" on group_members
for select using (
  user_id = auth.uid() OR EXISTS (
    select 1 from group_members gm2 where gm2.group_id = group_members.group_id and gm2.user_id = auth.uid()
  )
);
create policy "gm insert by group member" on group_members
for insert with check (
  EXISTS (
    select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid()
  ) OR auth.uid() = user_id -- self-join via invite code
);
create policy "gm delete by owner or self" on group_members
for delete using (
  EXISTS (select 1 from groups g where g.id = group_members.group_id and g.owner_id = auth.uid())
  OR auth.uid() = user_id
);

-- Items (core visibility rule)
create policy "item read if owner or in visible groups" on items
for select using (
  owner_id = auth.uid() OR EXISTS (
    select 1 from item_visibility iv
    join group_members gm on gm.group_id = iv.group_id
    where iv.item_id = items.id and gm.user_id = auth.uid()
  )
);
create policy "item insert by owner" on items
for insert with check ( owner_id = auth.uid() );
create policy "item update by owner" on items
for update using ( owner_id = auth.uid() );
create policy "item delete by owner" on items
for delete using ( owner_id = auth.uid() );

-- Photos inherit from parent item
create policy "photo read if can read item" on item_photos
for select using (
  EXISTS (
    select 1 from items i where i.id = item_photos.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  )
);
create policy "photo write by owner" on item_photos
for all using (
  EXISTS (
    select 1 from items i where i.id = item_photos.item_id and i.owner_id = auth.uid()
  )
) with check (
  EXISTS (
    select 1 from items i where i.id = item_photos.item_id and i.owner_id = auth.uid()
  )
);

-- Item visibility (owner only)
create policy "visibility read if can read item" on item_visibility
for select using (
  EXISTS (
    select 1 from items i where i.id = item_visibility.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  )
);
create policy "visibility write by owner" on item_visibility
for all using (
  EXISTS (
    select 1 from items i where i.id = item_visibility.item_id and i.owner_id = auth.uid()
  )
) with check (
  EXISTS (
    select 1 from items i where i.id = item_visibility.item_id and i.owner_id = auth.uid()
  )
);

-- Interests: insert/select if you can see the item; delete/update by author or item owner
create policy "interest read if related" on interests
for select using (
  EXISTS (
    select 1 from items i where i.id = interests.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  )
);
create policy "interest insert if can see item" on interests
for insert with check (
  EXISTS (
    select 1 from items i where i.id = interests.item_id and (
      i.owner_id = auth.uid() OR EXISTS (
        select 1 from item_visibility iv
        join group_members gm on gm.group_id = iv.group_id
        where iv.item_id = i.id and gm.user_id = auth.uid()
      )
    )
  ) AND auth.uid() = interests.user_id
);
create policy "interest update/delete by author or item owner" on interests
for all using (
  auth.uid() = interests.user_id OR EXISTS (select 1 from items i where i.id = interests.item_id and i.owner_id = auth.uid())
);

-- Reservations (owner controls; claimer can read)
create policy "reservation read if related" on reservations
for select using (
  EXISTS (select 1 from items i where i.id = reservations.item_id and (i.owner_id = auth.uid()))
  OR auth.uid() = reservations.claimer_id
);
create policy "reservation write by item owner" on reservations
for all using (
  EXISTS (select 1 from items i where i.id = reservations.item_id and i.owner_id = auth.uid())
) with check (
  EXISTS (select 1 from items i where i.id = reservations.item_id and i.owner_id = auth.uid())
);
```

---

## 8) Storage & uploads (supabase/storage-buckets.md)
- Create bucket `images` (private).
- Upload flow:
  1. Client compresses image (<= 1600px longest side, ~0.8 quality), strips EXIF.
  2. Request signed upload URL via Supabase.
  3. Store `storage_path` in `item_photos`.
- Download: generate signed URL per photo (or proxy via edge function later). Keep bucket private to avoid public scraping.

---

## 9) Minimal client scaffolding
**supabaseClient.ts**
```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)
```

**main.tsx**
```tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './app.css'
import './theme/tokens.css'
import Root from './routes/Root'
import Feed from './routes/Feed'
import NewItem from './routes/NewItem'
import Groups from './routes/Groups'
import Item from './routes/Item'

const rootRoute = createRootRoute({ component: Root })
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Feed })
const newItemRoute = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: NewItem })
const groupsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/groups', component: Groups })
const itemRoute = createRoute({ getParentRoute: () => rootRoute, path: '/item/$id', component: Item })

const routeTree = rootRoute.addChildren([indexRoute, newItemRoute, groupsRoute, itemRoute])
const router = createRouter({ routeTree })
const qc = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

**image.ts (compression util)**
```ts
import imageCompression from 'browser-image-compression'

export async function compress(file: File) {
  const options = { maxSizeMB: 0.4, maxWidthOrHeight: 1600, useWebWorker: true }
  const out = await imageCompression(file, options)
  return new File([await out.arrayBuffer()], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
}
```

---

## 10) UI guidance notes (theme-first, no purple)
- Base surfaces: near-black panels (`base-900/800/700`).
- Text: soft gray/ink. High contrast on headings, muted for metadata.
- Accent: **cool green** (`mint-400/600`) used sparingly: primary buttons, focus outlines, badges.
- Shapes: large 2xl radii, soft shadows only on elevated dialogs.
- Motion: subtle transforms on hover/focus; no bouncy spring.
- Density: compact lists; roomy modals/forms. Mobile-first layout.

**Example class combos**
- Card: `card p-4 md:p-6 shadow-sm border border-base-700`
- Primary button: `btn btn-accent text-black font-medium px-4 py-2`
- Muted: `text-ink-600`

---

## 11) Minimal feed query (hook sketch)
```ts
// useFeed.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export function useFeed() {
  return useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id,title,description,status,created_at,item_photos(storage_path)')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    }
  })
}
```

---

## 12) MCP Integration Plan (web/src/mcp/PLAN.md)
**Goal:** keep user content safe & searchable; assist with tags; automate tier releases.

- **Image pipeline MCP**
  - Functions: `stripExif(image)`, `classify(image)`, `phash(image)`
  - Trigger: before upload → block unsafe; dedupe via pHash.

- **Auto-tagging MCP**
  - Function: `suggestTags({title, description, imageThumb}) -> string[]`
  - Flow: propose tags at create-item; user can accept/reject.

- **Distance MCP**
  - Input: zip or city; Output: coarse lat/lon; Provide bucket 5/10/25 mi.

- **Release scheduler MCP**
  - Cron: `publish_at` flips `status` or inserts into `item_visibility` tier+1.

- **Moderation MCP**
  - Regex + ML for phone numbers, slurs, prohibited items → soft block with rationale.

---

## 13) Backlog (ops/TODOs.md extract)
- [ ] Auth: magic link + avatar profile
- [ ] Groups: create, join via invite code, leave
- [ ] Create item: form with multi-photo upload, visibility to 1+ groups
- [ ] Feed: list with filters (group, category), infinite scroll
- [ ] Item detail: photos, description, tags, interest button
- [ ] Interests: owner sees queue; select claimer → reservation expiring in 24h
- [ ] Messages: basic per-item thread (MVP text only)
- [ ] Notifications: email (new item in group, interest, reservation expiry)
- [ ] Publish at: widen visibility cron
- [ ] PWA shell + camera capture on mobile

---

## 14) Design review checkpoints
- Confirm logo/wordmark direction (monochrome with mint accent)
- Confirm button sizes + iconography set (Lucide)
- Confirm feed density and card style
- Confirm empty state illustrations (subtle outlines, no gradients)

---

## 15) Notes & conventions
- TypeScript strict; prefer Zod for any user input.
- Keep bucket private; always signed URLs on read.
- Favor TanStack Query for all data; single source of truth.
- Avoid over-theming; rely on tokens.

---

That’s the whole starter kit: DB schema + RLS, storage approach, theme tokens, and the client skeleton. Paste these into your repo to get moving. Additions/changes welcome in PRs.

