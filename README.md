# Compliance Issue Tracker

Track compliance issues from report to resolution: severity, owner, due date, status and evidence. Also includes an MCP server so an AI agent can work with issues, and a resolution playbook that needs human approval for risky actions.

Work in progress for the CompliWise take-home.

## Features

- [x] Login with member and admin roles
- [x] Issue list and issue details
- [x] Severity, owner, due date and status
- [x] Audit trail of every change
- [x] Evidence upload or link
- [x] Dashboard (open, overdue, completed)
- [ ] MCP server
- [ ] Resolution playbook with human approval

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and Supabase (Postgres + Auth + Storage).

## Running locally

You need Node.js 20+ and a free Supabase project.

```bash
git clone <repository-url>
cd compliance-issue-tracker
npm install
```

Set up the database in the Supabase dashboard:

1. In the SQL Editor, run `supabase/schema.sql`. It creates the tables, the access rules and the private `evidence` storage bucket.
2. In Authentication > Users, add `bob@example.com`, `alice@example.com` and `eve@example.com` (tick Auto Confirm).
3. In the SQL Editor, run `supabase/seed.sql` to give them names and roles and add 6 demo issues (two are always overdue).

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

Everyone who is logged in can see all issues and report new ones. Members can edit the title, description and status (open or in progress) of issues they reported or own, until the issue is resolved. Only admins can change severity, due date and owner, or mark an issue resolved or closed. Nobody can delete issues or change their own role.

The app checks these rules in its server actions, and Row Level Security policies in `supabase/schema.sql` enforce them again in the database, so they hold even outside the app.

## Audit trail

Every time an issue is created or edited, a row is added to `audit_log` with who did it, when, and what changed (for example `status: Open → In progress`). It shows on each issue's page, and the dashboard shows the 8 most recent entries across all issues. There are no update or delete rules on this table, so entries can't be changed or removed.

## Evidence

Evidence can be a link (http or https only) or an uploaded file (PDF, PNG, JPEG or text, up to 4 MB). Files go into a private storage bucket and open through links that expire after 5 minutes. Only admins and the issue's reporter or owner can add evidence, and evidence can't be changed or removed.

An issue can only be marked resolved once it has at least one piece of evidence. Closing an issue (for example a duplicate) doesn't need any.

## Project structure

```
src/app/         pages (each folder is a route)
src/app/login/   login page and login/logout actions
src/app/issues/  issue list, detail and edit pages, and the create/update actions
src/components/  header, navigation, forms and badges
src/lib/         Supabase clients, current-user helper, validation and issue helpers
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
