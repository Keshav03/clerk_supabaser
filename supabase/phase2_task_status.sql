-- Phase 2: replace the boolean `completed` flag with a three-state `status`
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

-- 1) Add the column with a constrained set of values
alter table tasks
  add column if not exists status text not null default 'todo';

alter table tasks
  drop constraint if exists tasks_status_check;

alter table tasks
  add constraint tasks_status_check
  check (status in ('todo', 'doing', 'done'));

-- 2) Backfill from the old boolean, then retire it.
-- Guarded because the column is absent on databases that never had it.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'tasks' and column_name = 'completed'
  ) then
    update tasks set status = 'done' where completed is true;
    alter table tasks drop column completed;
  end if;
end $$;

create index if not exists tasks_org_id_status_idx on tasks (org_id, status);

-- 3) Verify
select status, count(*) from tasks group by status;
