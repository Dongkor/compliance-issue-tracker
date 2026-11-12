-- Database schema for the Compliance Issue Tracker.
-- Ran in the Supabase SQL Editor.

create type public.user_role as enum ('member', 'admin');
create type public.issue_severity as enum ('low', 'medium', 'high', 'critical');
create type public.issue_status as enum ('open', 'in_progress', 'resolved', 'closed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now()
);

create table public.issues (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  severity public.issue_severity not null,
  status public.issue_status not null default 'open',
  owner_id uuid references public.profiles (id),
  reported_by uuid not null references public.profiles (id),
  due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.issues enable row level security;

-- Access rules (RLS policies).
-- There are no delete rules, so nobody can delete issues.
-- There is no update rule on profiles, so members cannot make themselves admins.

-- Any logged-in user can read profiles (to show owner and reporter names).
create policy "Logged-in users can read profiles"
on public.profiles for select to authenticated
using (true);

-- Any logged-in user can read all issues.
create policy "Logged-in users can read issues"
on public.issues for select to authenticated
using (true);

-- Logged-in users can report an issue, but only as themselves.
create policy "Users can report issues as themselves"
on public.issues for insert to authenticated
with check (reported_by = auth.uid());

-- Admins can update any issue. Members can update issues they reported or own,
-- but cannot set the status to resolved or closed.
create policy "Admins, reporters and owners can update issues"
on public.issues for update to authenticated
using (
  reported_by = auth.uid()
  or owner_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  or status in ('open', 'in_progress')
);
