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
- [x] MCP server
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
src/app/api/agent/  agent API used by the MCP server (token required)
src/lib/         Supabase clients, current-user and agent token checks, validation and issue helpers
src/proxy.ts     refreshes the session and redirects to /login (skips /api)
mcp-server/      the MCP server (index.ts)
supabase/        schema.sql and seed.sql
```

## Architecture

TODO

## MCP server

The MCP server lets an AI app such as Claude Desktop or Claude Code work with issues. The AI app starts it and talks to it over stdio. Each tool calls the tracker's agent API with an API token; the MCP server never talks to the database directly.

### Tools

| Tool | What it does |
| --- | --- |
| `list_issues` | Lists issues, optionally filtered: `all`, `open`, `in_progress`, `overdue`, `completed`. Read-only. |
| `get_issue` | One issue with its evidence and audit trail. Read-only. |
| `add_note` | Adds a note to the issue's audit trail as "AI Agent". It never changes the issue itself. |

### Setup

1. Make sure `SUPABASE_SECRET_KEY` is in `.env.local` and the agent user and profile exist (steps 2 and 3 of [Running locally](#running-locally)).
2. Start the app with `npm run dev` and log in as an admin (bob@example.com).
3. On the dashboard, open **API tokens**, create a token and copy it. It is shown only once.

### Connect Claude Desktop

In Claude Desktop, open Settings > Developer > Edit Config and add the server (use your own path and token). Then quit and reopen Claude Desktop.

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
        "APP_URL": "http://localhost:3000",
        "AGENT_API_TOKEN": "<your-token>"
      }
    }
  }
}
```

`node` with the path to `tsx` is used instead of `npx`, because some apps on Windows can't start `npx` directly.

### Connect Claude Code

```bash
claude mcp add compliance-tracker -e APP_URL=http://localhost:3000 -e AGENT_API_TOKEN=<your-token> -- node <path-to-repo>/node_modules/tsx/dist/cli.mjs <path-to-repo>/mcp-server/index.ts
```

### Try it

- "Which compliance issues are overdue?"
- "Review issue #1 and add a short note with recommended next steps."

Claude asks before running `add_note`, because it changes data.

### Safety

- The agent API only accepts requests with a valid API token. Only a hash of each token is stored, and an admin can revoke a token at any time.
- The agent can only read issues and add notes. It has no way to change, resolve or delete an issue.
- Text written by users (titles, descriptions, notes) is wrapped in `<untrusted_data>` in tool results, so the AI treats it as information, not as instructions.
- The Supabase secret key is only used on the server, by the agent API. The MCP server and the AI never see it.

## Resolution playbook

TODO

## Security

TODO

## Testing

TODO

## Deployment

TODO
