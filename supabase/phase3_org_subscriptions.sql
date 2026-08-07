-- Phase 3: mirror Clerk org subscriptions so plan state survives outside the session token
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

create table if not exists org_subscriptions (
  org_id text primary key,
  subscription_id text not null,
  plan_slug text,
  status text not null,
  updated_at timestamptz not null default now()
);

alter table org_subscriptions enable row level security;

-- Members may read their own org's subscription. Writes only happen from the
-- webhook, which uses the service role key and bypasses RLS.
drop policy if exists "Members can view their org subscription" on org_subscriptions;

create policy "Members can view their org subscription"
on org_subscriptions for select
to authenticated
using (org_id = (select auth.jwt()->'o'->>'id'));

-- Verify
select policyname, cmd from pg_policies where tablename = 'org_subscriptions';
