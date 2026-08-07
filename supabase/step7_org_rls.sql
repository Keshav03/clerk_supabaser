-- Step 7: Org-scoped RLS for tasks
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
--
-- Requires:
--   1. tasks.org_id column already exists (Step 5)
--   2. Clerk JWT includes org under claim path: o.id (confirmed in Step 6)

-- 1) Ensure org_id exists (safe if you already added it)
alter table tasks
  add column if not exists org_id text;

create index if not exists tasks_org_id_idx on tasks (org_id);

-- 2) Default org_id from Clerk JWT on insert
alter table tasks
  alter column org_id set default (auth.jwt()->'o'->>'id');

-- 3) Drop old user-scoped policies (from the original README setup)
drop policy if exists "Users can view their own tasks" on tasks;
drop policy if exists "Users can insert their own tasks" on tasks;
drop policy if exists "Users can update their own tasks" on tasks;
drop policy if exists "Users can delete their own tasks" on tasks;

-- Also drop Step 7 policies if you re-run this script
drop policy if exists "Members can view org tasks" on tasks;
drop policy if exists "Members can insert org tasks" on tasks;
drop policy if exists "Members can update org tasks" on tasks;
drop policy if exists "Members can delete org tasks" on tasks;

-- 4) Org-scoped policies (Clerk token: auth.jwt()->'o'->>'id')
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

create policy "Members can delete org tasks"
on tasks for delete
to authenticated
using (org_id = (select auth.jwt()->'o'->>'id'));

-- 5) Verify
select policyname, cmd
from pg_policies
where tablename = 'tasks'
order by policyname;
