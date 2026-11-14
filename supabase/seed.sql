-- Demo profiles for the Compliance Issue Tracker.
-- First create the three users in Supabase (Authentication > Users > Add user,
-- with Auto Confirm ticked), then run this file in the SQL Editor.

insert into public.profiles (id, full_name, role)
select id, 'Bob Santos', 'admin' from auth.users where email = 'bob@example.com';

insert into public.profiles (id, full_name, role)
select id, 'Alice Reyes', 'member' from auth.users where email = 'alice@example.com';

insert into public.profiles (id, full_name, role)
select id, 'Eve Cruz', 'member' from auth.users where email = 'eve@example.com';

-- Demo issues. Due dates are relative to the day this runs (current_date - 3
-- means "three days ago"), so two open issues are always overdue.
-- A profile's id is the same as its login user's id, so owners and reporters
-- are looked up by email in auth.users.
insert into public.issues (title, description, severity, status, owner_id, reported_by, due_date) values
(
  'Old employee can still log in to payroll',
  'Mark left last month but his payroll account still works.',
  'critical', 'open',
  (select id from auth.users where email = 'eve@example.com'),
  (select id from auth.users where email = 'alice@example.com'),
  current_date - 3
),
(
  'Vendor contract has no privacy section',
  'The new backup vendor contract does not say how they handle our data.',
  'high', 'in_progress',
  (select id from auth.users where email = 'alice@example.com'),
  (select id from auth.users where email = 'bob@example.com'),
  current_date + 7
),
(
  'Some laptops are not encrypted',
  'IT found 4 laptops without encryption turned on.',
  'high', 'open',
  null,
  (select id from auth.users where email = 'eve@example.com'),
  current_date + 10
),
(
  'Staff have not finished privacy training',
  '12 people still need to finish this year''s training.',
  'medium', 'in_progress',
  (select id from auth.users where email = 'eve@example.com'),
  (select id from auth.users where email = 'bob@example.com'),
  current_date - 1
),
(
  'Visitors not signing in at front desk',
  'Nobody signed the visitor book last week.',
  'low', 'open',
  null,
  (select id from auth.users where email = 'alice@example.com'),
  current_date + 14
),
(
  'Password policy is outdated',
  'The password policy document is from 2022.',
  'medium', 'resolved',
  (select id from auth.users where email = 'alice@example.com'),
  (select id from auth.users where email = 'bob@example.com'),
  current_date - 5
);

-- The AI agent's profile. First add agent@example.com in Authentication > Users
-- (Auto Confirm ticked, a long random password nobody keeps): nobody logs in as
-- the agent; the user only exists so the profile can link to it.
-- Its API tokens are created by an admin in the app ("API tokens" in the header).
insert into public.profiles (id, full_name, role)
select id, 'AI Agent', 'agent' from auth.users where email = 'agent@example.com';
