# clerk-supabaser

A minimal Next.js starter wiring [Clerk](https://clerk.com) (auth) to [Supabase](https://supabase.com) (Postgres) using Supabase's native third-party auth integration — no JWT templates, no user-sync webhook.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript
- Tailwind CSS + shadcn/ui
- Clerk (`@clerk/nextjs`) — auth
- Supabase (`@supabase/supabase-js`) — Postgres + RLS

## Setup

### 1. Environment variables

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

**Clerk** — [Dashboard](https://dashboard.clerk.com) → your app → **API Keys**:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

**Supabase** — [Dashboard](https://supabase.com/dashboard) → your project → **Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the `anon`/publishable key)

### 2. Link Clerk and Supabase

1. In the **Clerk Dashboard**, find the Supabase integration setup and activate it to get your Clerk domain (looks like `https://your-app.clerk.accounts.dev`).
2. In the **Supabase Dashboard** → your project → `/auth/third-party` → add a new provider → **Clerk** → paste that domain.

Without this step, Supabase will reject Clerk's session tokens and every query will fail RLS checks.

### 3. Create the `tasks` table

Run this in the Supabase **SQL Editor**:

```sql
create table tasks (
  id bigint generated always as identity primary key,
  name text not null,
  user_id text not null default (auth.jwt()->>'sub'),
  created_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "Users can view their own tasks"
on tasks for select
to authenticated
using ((select auth.jwt()->>'sub') = user_id);

create policy "Users can insert their own tasks"
on tasks for insert
to authenticated
with check ((select auth.jwt()->>'sub') = user_id);

create policy "Users can update their own tasks"
on tasks for update
to authenticated
using ((select auth.jwt()->>'sub') = user_id)
with check ((select auth.jwt()->>'sub') = user_id);

create policy "Users can delete their own tasks"
on tasks for delete
to authenticated
using ((select auth.jwt()->>'sub') = user_id);
```

### 4. Run it

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign up, then visit `/dashboard` to add and view tasks scoped to your account.

## Project structure

- `src/proxy.ts` — Clerk middleware (Next.js 16's renamed `middleware.ts`), runs on every request.
- `src/app/layout.tsx` — wraps the app in `ClerkProvider`.
- `src/components/header.tsx` — sign-in/sign-up/user button controls.
- `src/app/sign-in`, `src/app/sign-up` — Clerk's hosted auth flows.
- `src/lib/supabase/server.ts` — Supabase client for Server Components/Route Handlers, authenticated via `auth().getToken()`.
- `src/lib/supabase/client.ts` — Supabase client for Client Components, authenticated via the `useSession()` hook.
- `src/app/dashboard/page.tsx` — protected example page (`auth.protect()`) reading/writing the `tasks` table.

Authorization is enforced by Postgres Row Level Security, not application code — see the RLS policies above.
