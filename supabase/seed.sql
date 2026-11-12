-- Demo profiles for the Compliance Issue Tracker.
-- First create the three users in Supabase (Authentication > Users > Add user,
-- with Auto Confirm ticked), then run this file in the SQL Editor.

insert into public.profiles (id, full_name, role)
select id, 'Bob Santos', 'admin' from auth.users where email = 'bob@example.com';

insert into public.profiles (id, full_name, role)
select id, 'Alice Reyes', 'member' from auth.users where email = 'alice@example.com';

insert into public.profiles (id, full_name, role)
select id, 'Eve Cruz', 'member' from auth.users where email = 'eve@example.com';
