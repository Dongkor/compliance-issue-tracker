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
