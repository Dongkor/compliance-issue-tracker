# Compliance Issue Tracker

Track compliance issues from report to resolution: severity, owner, due date, status and evidence. Also includes an MCP server so an AI agent can work with issues, and a resolution playbook that needs human approval for risky actions.

Work in progress for the CompliWise take-home.

## Features

- [x] Login with member and admin roles
- [ ] Issue list and issue details
- [ ] Severity, owner, due date and status
- [ ] Evidence upload or link
- [ ] Dashboard (open, overdue, completed)
- [ ] MCP server
- [ ] Resolution playbook with human approval

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and Supabase (Postgres + Auth).

## Running locally

You need Node.js 20+ and a free Supabase project.

```bash
git clone <repository-url>
cd compliance-issue-tracker
npm install
```

Set up the database in the Supabase dashboard:

1. In the SQL Editor, run `supabase/schema.sql`.
2. In Authentication > Users, add `bob@example.com`, `alice@example.com` and `eve@example.com` (tick Auto Confirm).
3. In the SQL Editor, run `supabase/seed.sql` to give them names and roles.

Create `.env.local` with your project's URL and publishable key (Supabase dashboard > Connect):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Then start the app and go to http://localhost:3000:

```bash
npm run dev
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

### Demo accounts

- bob@example.com (admin)
- alice@example.com (member)
- eve@example.com (member)

## Roles

Everyone who is logged in can see all issues and report new ones. Members can edit issues they reported or own, but only admins can mark an issue resolved or closed. Nobody can delete issues or change their own role.

These rules are Row Level Security policies in `supabase/schema.sql`, so the database enforces them even outside the app.

## Project structure

```
src/app/         pages (each folder is a route)
src/app/login/   login page and login/logout actions
src/lib/         Supabase clients and the current-user helper
src/proxy.ts     refreshes the session and redirects to /login
supabase/        schema.sql and seed.sql
```

## Architecture

TODO

## MCP server

TODO

## Resolution playbook

TODO

## Security

TODO

## Testing

TODO

## Deployment

TODO
