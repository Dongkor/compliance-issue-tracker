# Compliance Issue Tracker

Track compliance issues from report to resolution: severity, owner, due date, status and evidence. Also includes an MCP server so an AI agent can work with issues, and a resolution playbook that checks issues against fixed rules and recommends next steps.

## Features

| Feature         | Description                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| Login and roles | Members report and work on issues; admins assign owners and resolve.        |
| Issue list      | All issues in a table, filtered by open, in progress, overdue or completed. |
| Issue details   | Severity, owner, due date, status, evidence and audit trail on one page.    |
| Evidence        | Attach a link or upload a file (PDF, image or text).                        |
| Audit trail     | Every change is recorded with who did it and when, and can't be edited.     |
| Dashboard       | Counts of open, overdue and completed issues, plus recent activity.         |
| MCP server      | Lets an AI app read issues, add notes and run the playbook.                 |
| Playbook        | Checks an issue against fixed rules and recommends next steps.              |

## Tech stack

Next.js 16 (App Router), TypeScript, Tailwind CSS 4 and Supabase (Postgres + Auth + Storage).

## Getting started

There are two ways to try it, but the [MCP server](#mcp-server) is always set up locally:

- **Live app:** open https://compliance-issue-tracker.vercel.app and log in with a [demo account](#demo-accounts). Nothing to install.
- **Locally:** run the app on your machine with your own Supabase project. See [Running locally](#running-locally).

## Running locally

You need Node.js 20+ and a free Supabase project.

```bash
git clone https://github.com/Dongkor/compliance-issue-tracker.git
cd compliance-issue-tracker
npm install
```

Set up the database in the Supabase dashboard:

1. In the SQL Editor, run `supabase/schema.sql`. It creates the tables, the access rules and the private `evidence` storage bucket.
2. In Authentication > Users, add `bob@example.com`, `alice@example.com`, `eve@example.com` and `agent@example.com` (tick Auto Confirm). Nobody logs in as the agent; it gives the AI agent its own profile.
3. In the SQL Editor, run `supabase/seed.sql` to give them names and roles (including "AI Agent") and add 6 demo issues (two are always overdue).

Create `.env.local` with your project's URL, publishable key and secret key (Supabase dashboard > Connect, and Project Settings > API Keys):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

The secret key has no `NEXT_PUBLIC_` prefix, so it stays on the server. It is only used by the agent API (see [MCP server](#mcp-server)).

Then start the app and go to http://localhost:3000:

```bash
npm run dev
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm test`.

### Demo accounts

- bob@example.com (admin)
- alice@example.com (member)
- eve@example.com (member)

The password is shared on request.

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
src/app/            pages (each folder is a route)
src/app/login/      login page and login/logout actions
src/app/issues/     issue list, detail and edit pages, and the create/update actions
src/app/tokens/     create and revoke API tokens (admins only)
src/app/api/agent/  agent API used by the MCP server (token required)
src/components/     header, navigation, forms and badges
src/lib/            Supabase clients, current-user and agent token checks, validation, issue helpers and playbook rules
src/proxy.ts        refreshes the session and redirects to /login (skips /api)
mcp-server/         the MCP server (index.ts)
supabase/           schema.sql and seed.sql
```

## Architecture

```
Browser ──► Next.js on Vercel ──► Supabase (Postgres, Auth, Storage)
            (pages, server actions,
             agent API /api/agent/*)
                  ▲
AI app ──► MCP server (local), with an API token
```

- Pages are server components that read from Supabase as the logged-in user. Changes go through server actions (`actions.ts` files), which check the user's role before saving.
- Row Level Security in the database checks the same rules again.
- The agent API is part of the Next.js app. It checks the API token, then uses the secret key for a few fixed routes. The MCP server only calls those routes.
- There is no "overdue" column. An issue is overdue when its due date has passed and it isn't resolved or closed, which is checked each time it's shown.

## MCP server

The MCP server lets an AI app such as Claude Desktop or Claude Code work with issues. The AI app starts it and talks to it over stdio. Each tool calls the tracker's agent API with an API token; the MCP server never talks to the database directly.

### Tools

| Tool           | What it does                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `list_issues`  | Lists issues, optionally filtered: `all`, `open`, `in_progress`, `overdue`, `completed`. Read-only.                                        |
| `get_issue`    | One issue with its evidence and audit trail. Read-only.                                                                                    |
| `add_note`     | Adds a note to the issue's audit trail as "AI Agent". It never changes the issue itself.                                                   |
| `run_playbook` | Runs the [playbook](#playbook) on one issue. Dry run by default; with `apply` it records the result and can move the issue to in progress. |

### Setup

Clone the repo and run `npm install` first: the MCP server always runs on your machine, whichever app it talks to. Then pick one:

**Running locally**

1. Follow [Running locally](#running-locally), including `SUPABASE_SECRET_KEY` and the agent user.
2. Start the app with `npm run dev` and log in as an admin (bob@example.com).
3. On the dashboard, open **API tokens**, create a token and copy it. It is shown only once.
4. Use `http://localhost:3000` as `<app-url>` below.

**Using the live app**

1. Log in to https://compliance-issue-tracker.vercel.app as an admin (bob@example.com).
2. On the dashboard, open **API tokens**, create a token and copy it. It is shown only once.
3. Use `https://compliance-issue-tracker.vercel.app` as `<app-url>` below.

### Connect Claude Desktop

In Claude Desktop, open Settings > Developer > Edit Config and add the server (use your own path, app URL and token). Then quit and reopen Claude Desktop.

```json
{
  "mcpServers": {
    "compliance-tracker": {
      "command": "node",
      "args": [
        "<path-to-repo>/node_modules/tsx/dist/cli.mjs",
        "<path-to-repo>/mcp-server/index.ts"
      ],
      "env": {
        "APP_URL": "<app-url>",
        "AGENT_API_TOKEN": "<your-token>"
      }
    }
  }
}
```

`node` with the path to `tsx` is used instead of `npx`, because some apps on Windows can't start `npx` directly.

### Try it

- "Which compliance issues are overdue?"
- "Review issue #1 and add a short note with recommended next steps."
- "Run the playbook on issue #1."

Claude asks before running `add_note` or `run_playbook`, because they change data.

### Safety

- The agent API only accepts requests with a valid API token. Only a hash of each token is stored, and an admin can revoke a token at any time.
- The agent can read issues, add notes and run the playbook. The playbook's only change to an issue is moving it from open to in progress when it has an owner. The agent can't resolve, close or delete an issue.
- Text written by users (titles, descriptions, notes) is wrapped in `<untrusted_data>` in tool results, so the AI treats it as information, not as instructions.
- The Supabase secret key is only used on the server, by the agent API. The MCP server and the AI never see it.

## Playbook

The playbook checks an issue against fixed rules (`src/lib/playbook.ts`) and recommends next steps. Claude runs it with the `run_playbook` tool.

It looks at severity, owner, due date, evidence and status. For example: no owner → "An admin should assign an owner"; in progress with evidence → "Ready to resolve".

- **Dry run** (default): shows the report and saves nothing.
- **Apply** (after you agree): adds the report to the audit trail as "AI Agent · playbook" and moves an open issue with an owner to in progress.
- It never resolves or closes an issue. An admin does that in the app.

It never reads the title or description, so text in an issue can't change what it does.

### Example

Ask Claude "Run the playbook on issue #1":

```
Findings:
- Critical severity.
- 4 day(s) overdue.
- No evidence yet.

Recommended steps:
- Act within 24 hours.
- Tell an admin and agree a new plan with the owner.
- Add evidence that shows the fix (a file or a link).

Status: would move from open to in progress.
```

Say "apply it" and #1 moves to In progress with the report in its audit trail. Once Eve adds evidence, running it again says it's ready to resolve, and Bob resolves it.

## Security

- Logged-out users are sent to the login page. Roles are checked in the UI, in server actions and again by Row Level Security.
- All input is checked on the server with zod.
- The audit log and evidence can't be edited or deleted.
- Evidence links must start with http or https, so a link like `javascript:...` can't run code. Files are limited by type and size, kept in a private bucket and opened through links that expire after 5 minutes.
- Secrets live in environment variables. The secret key is only used on the server.

## Testing

- `npm test` runs the playbook rule tests (Vitest), for example "never recommends resolving without evidence".
- To test the roles, log in as Alice (member): she can edit issues she reported, but can't resolve them or change the owner. Bob (admin) can.
- To test the evidence rule, try resolving an issue with no evidence: it's refused.
- To test the MCP server, connect it and use the prompts in [Try it](#try-it).

## Deployment

Live at https://compliance-issue-tracker.vercel.app

The project is deployed on Vercel with the necessary environment variables. To use the MCP server with it, set `APP_URL` to the deployed URL.
