# Setup

You'll need a Clerk application and a Supabase project. Nothing here is scripted yet — the schema is hand-run SQL, which is a known rough edge.

## 1. Environment

```bash
cp .env.local.example .env.local
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SIGNING_SECRET` | Clerk Dashboard → Webhooks → your endpoint |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (keep it server-side) |

## 2. Link Clerk to Supabase

In the Clerk Dashboard, activate the Supabase integration to get your Clerk domain (`https://your-app.clerk.accounts.dev`). Then in Supabase, go to Authentication → Third Party Auth, add Clerk, and paste that domain.

Skip this and Supabase rejects every token, which looks like an app where nothing ever loads.

## 3. Enable organizations

Clerk Dashboard → Organizations → enable. Then under Roles & Permissions, add a permission with the key `org:tasks:delete` and assign it to the Admin role. Both steps matter: creating the permission is not enough on its own, and `has()` silently returns `false` for a key that does not exist, so the delete button stays hidden for everyone until the key matches exactly and Admin has it.

## 4. Create the schema

Run this in the Supabase SQL Editor. (The files in `supabase/` are the incremental migrations I applied while building — useful as history, but this is the current state in one go.)

```sql
create table tasks (
  id bigint generated always as identity primary key,
  name text not null,
  org_id text not null default (auth.jwt()->'o'->>'id'),
  user_id text not null default (auth.jwt()->>'sub'),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  created_at timestamptz not null default now()
);

create index tasks_org_id_idx on tasks (org_id);
create index tasks_org_id_status_idx on tasks (org_id, status);

alter table tasks enable row level security;

create policy "Members can view org tasks"
on tasks for select
to authenticated
using (org_id = (select auth.jwt()->'o'->>'id'));

create policy "Members can insert org tasks"
on tasks for insert
to authenticated
with check (org_id = (select auth.jwt()->'o'->>'id'));

create policy "Members can update org tasks"
on tasks for update
to authenticated
using (org_id = (select auth.jwt()->'o'->>'id'))
with check (org_id = (select auth.jwt()->'o'->>'id'));

create policy "Admins can delete org tasks"
on tasks for delete
to authenticated
using (
  org_id = (select auth.jwt()->'o'->>'id')
  and (select auth.jwt()->'o'->>'rol') = 'admin'
);
```

Plan limits live in their own table so they can change without a deploy. A null limit means unlimited:

```sql
create table plan_task_limits (
  plan_slug text primary key,
  task_limit integer
);

insert into plan_task_limits (plan_slug, task_limit) values
  ('free_user', 5),
  ('pro', 50),
  ('pro_max', null);

alter table plan_task_limits enable row level security;

create policy "Anyone signed in can read plan limits"
on plan_task_limits for select
to authenticated
using (true);
```

Then run `supabase/phase3_org_subscriptions.sql` for the table the billing webhook writes to.

## 5. Start it

```bash
npm install
npm run dev
```

Sign up, create an organization from the switcher in the header, then go to `/dashboard`. Create a second organization and switch between them — the task lists are completely separate.

## Testing webhooks locally

```bash
clerk webhooks listen --token "$(clerk webhooks token)" --forward-to http://localhost:3000/api/webhooks/clerk
```

Add the relay URL it prints as an endpoint in the Clerk Dashboard, subscribed to the `subscription.*` events. Nothing is delivered until you do.
