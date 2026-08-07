-- Phase 2: only org admins can delete tasks
-- Run this in Supabase Dashboard → SQL Editor → New query → Run
--
-- Clerk puts the org role at auth.jwt()->'o'->>'rol' (value: 'admin' | 'member').

drop policy if exists "Members can delete org tasks" on tasks;
drop policy if exists "Admins can delete org tasks" on tasks;

create policy "Admins can delete org tasks"
on tasks for delete
to authenticated
using (
  org_id = (select auth.jwt()->'o'->>'id')
  and (select auth.jwt()->'o'->>'rol') = 'admin'
);

-- Verify
select policyname, cmd
from pg_policies
where tablename = 'tasks'
order by policyname;
