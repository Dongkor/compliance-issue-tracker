# Compliance Issue Tracker

A web application for tracking compliance issues: reporting them, assigning owners, attaching evidence and following them through to resolution. It is planned to include an MCP server that lets an AI agent work with issues safely, and an automated resolution playbook.

## Features

| Feature                                           | Status      |
| ------------------------------------------------- | ----------- |
| Next.js app scaffold                              | Done        |
| Login and role-based access                       | To be added |
| Issue list and issue details                      | To be added |
| Severity, owner, due date and status              | To be added |
| Evidence upload or link                           | To be added |
| Dashboard (open, overdue, completed)              | To be added |
| MCP server for AI agents                          | To be added |
| Automated resolution playbook with human approval | To be added |

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router) with TypeScript
- [Tailwind CSS](https://tailwindcss.com) 4 for styling

_Supabase (database, login, file storage) and the MCP SDK are added in later steps._

## Requirements

- Node.js 20 or newer (developed on Node.js 24)
- npm (comes with Node.js)

## Getting started

```bash
git clone <repository-url>
cd compliance-issue-tracker
npm install
npm run dev
```

Then open http://localhost:3000 in a browser.

## Scripts

| Command         | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `npm run dev`   | Starts the development server with live reload        |
| `npm run build` | Builds the app for production                         |
| `npm run start` | Runs the production build (run `npm run build` first) |
| `npm run lint`  | Checks the code with ESLint                           |

## Project structure

```
src/app/          Pages and layouts (App Router: each folder is a URL route)
public/           Static files served as-is (images, icons)
next.config.ts    Next.js settings
```

## Architecture

_To be added._

## Environment variables

_To be added._

## Roles and permissions

_To be added._

## MCP server

_To be added._

## Automated resolution playbook

_To be added._

## Security

_To be added._

## Testing

_To be added._

## Deployment

_To be added._
