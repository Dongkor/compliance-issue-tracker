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

-- Audit log: one row per change to an issue, for example
-- action "updated", description "status: open → in_progress".
-- There are no update or delete rules, so entries can never be changed or removed.
create table public.audit_log (
  id bigint generated always as identity primary key,
  issue_id bigint not null references public.issues (id),
  actor_id uuid not null references public.profiles (id),
  action text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

-- Any logged-in user can read the audit trail.
create policy "Logged-in users can read the audit log"
on public.audit_log for select to authenticated
using (true);

-- Users can add entries only in their own name.
create policy "Users can add audit entries as themselves"
on public.audit_log for insert to authenticated
with check (actor_id = auth.uid());

-- Evidence: a link or an uploaded file that supports an issue.
-- A link row needs a url; a file row needs a file_path (where it sits in storage).
-- There are no update or delete rules, so evidence can't be changed or removed.
create table public.evidence (
  id bigint generated always as identity primary key,
  issue_id bigint not null references public.issues (id),
  added_by uuid not null references public.profiles (id),
  type text not null check (type in ('link', 'file')),
  name text not null,
  url text,
  file_path text,
  created_at timestamptz not null default now(),
  check (
    (type = 'link' and url is not null)
    or (type = 'file' and file_path is not null)
  )
);

alter table public.evidence enable row level security;

-- Any logged-in user can see evidence.
create policy "Logged-in users can read evidence"
on public.evidence for select to authenticated
using (true);

-- Evidence can be added only in your own name, by an admin or by the
-- issue's reporter or owner.
create policy "Admins, reporters and owners can add evidence"
on public.evidence for insert to authenticated
with check (
  added_by = auth.uid()
  and (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    or exists (
      select 1 from public.issues
      where issues.id = evidence.issue_id
        and (issues.reported_by = auth.uid() or issues.owner_id = auth.uid())
    )
  )
);

-- A private storage bucket for evidence files. Supabase itself rejects files
-- over 4 MB (4 * 1024 * 1024 bytes) or of any other type.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'evidence',
  'evidence',
  false,
  4194304,
  array['application/pdf', 'image/png', 'image/jpeg', 'text/plain']
);

-- Logged-in users can upload files into the evidence bucket.
create policy "Logged-in users can upload evidence files"
on storage.objects for insert to authenticated
with check (bucket_id = 'evidence');

-- Logged-in users can read evidence files. The bucket is private, so the app
-- hands out short-lived signed links instead of public ones.
create policy "Logged-in users can read evidence files"
on storage.objects for select to authenticated
using (bucket_id = 'evidence');

-- The AI agent gets its own role, so the app and the audit log can tell it
-- apart from people. It is neither a member nor an admin.
-- Run this line on its own: Postgres won't let a new value be used in the
-- same run that adds it.
alter type public.user_role add value 'agent';

-- API tokens for callers that are not people (the MCP server).
-- Only a hash of each token is stored, like a password; the real token is
-- shown once when an admin creates it and then lives in the MCP server's
-- settings. revoked_at set = the token no longer works.
create table public.api_tokens (
  id bigint generated always as identity primary key,
  name text not null,
  token_hash text not null unique,
  profile_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.api_tokens enable row level security;

-- Only admins can see, create and revoke tokens (from the "API tokens" popup).
-- Checking a token on an agent request is done by the Next.js server with the
-- secret key, which RLS doesn't apply to.
create policy "Admins can read API tokens"
on public.api_tokens for select to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can create API tokens"
on public.api_tokens for insert to authenticated
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins can revoke API tokens"
on public.api_tokens for update to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
