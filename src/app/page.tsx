import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SeverityBadge from "@/components/severity-badge";
import {
  countIssues,
  daysLate,
  formatDate,
  formatDateTime,
  isCompleted,
  isOverdue,
  type IssueSeverity,
  type IssueStatus,
} from "@/lib/issues";

// One issue, as returned by the query below.
type DashboardIssue = {
  id: number;
  title: string;
  severity: IssueSeverity;
  status: IssueStatus;
  due_date: string;
  updated_at: string;
};

// One row of the recent activity list, for example
// { action: "updated", description: "status: Open → In progress",
//   actor: { full_name: "Bob Santos" }, issue: { id: 1, title: "..." } }.
type ActivityEntry = {
  id: number;
  action: string;
  description: string;
  created_at: string;
  actor: { full_name: string };
  issue: { id: number; title: string };
};

// The count cards. They use the same filters as the /issues tabs,
// so the numbers always match, and each card links to its tab.
const cards = [
  { filter: "open", label: "Open" },
  { filter: "in_progress", label: "In progress" },
  { filter: "overdue", label: "Overdue" },
  { filter: "completed", label: "Completed" },
];

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("issues")
    .select("id, title, severity, status, due_date, updated_at");

  if (error) {
    return (
      <main className="flex-1 p-4 sm:p-6">
        <p className="text-red-300">Could not load the dashboard. Try again later.</p>
      </main>
    );
  }

  const issues = data as DashboardIssue[];

  // Split the issues into the two lists.
  const overdueIssues: DashboardIssue[] = [];
  const completedIssues: DashboardIssue[] = [];
  for (const issue of issues) {
    if (isOverdue(issue)) {
      overdueIssues.push(issue);
    }
    if (isCompleted(issue)) {
      completedIssues.push(issue);
    }
  }

  // Most late first: the earliest due date comes first ("2026-11-10" before "2026-11-12").
  overdueIssues.sort((a, b) => a.due_date.localeCompare(b.due_date));

  // Most recently changed first, and only the latest 5.
  completedIssues.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const recentlyCompleted = completedIssues.slice(0, 5);

  // The latest 8 audit entries across all issues, newest first,
  // with who did it and which issue it was.
  const { data: activityData } = await supabase
    .from("audit_log")
    .select("id, action, description, created_at, actor:profiles(full_name), issue:issues(id, title)")
    .order("created_at", { ascending: false })
    .limit(8);

  // See the note in src/app/issues/page.tsx: without generated database
  // types, Supabase guesses the joined names are lists.
  const recentActivity = (activityData ?? []) as unknown as ActivityEntry[];

  return (
    <main className="flex-1 space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.filter}
            href={`/issues?status=${card.filter}`}
            className="rounded-2xl border border-line bg-card p-5 hover:border-accent"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p
              className={
                card.filter === "overdue"
                  ? "mt-1 text-3xl font-semibold text-red-300"
                  : "mt-1 text-3xl font-semibold"
              }
            >
              {countIssues(issues, card.filter)}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="space-y-3 rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Overdue issues</h2>
          {overdueIssues.length === 0 ? (
            <p className="text-sm text-muted">Nothing is overdue.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {overdueIssues.map((issue) => (
                <li key={issue.id} className="flex items-center justify-between gap-3">
                  <Link href={`/issues/${issue.id}`} className="hover:text-violet-300">
                    <span className="text-muted">#{issue.id}</span> {issue.title}
                  </Link>
                  <span className="shrink-0 text-red-300">
                    {daysLate(issue.due_date)} {daysLate(issue.due_date) === 1 ? "day" : "days"} late
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl border border-line bg-card p-5">
          <h2 className="font-semibold">Recently completed</h2>
          {recentlyCompleted.length === 0 ? (
            <p className="text-sm text-muted">No completed issues yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {recentlyCompleted.map((issue) => (
                <li key={issue.id} className="flex items-center justify-between gap-3">
                  <Link href={`/issues/${issue.id}`} className="hover:text-violet-300">
                    <span className="text-muted">#{issue.id}</span> {issue.title}
                  </Link>
                  <span className="flex shrink-0 items-center gap-2 text-muted">
                    <SeverityBadge severity={issue.severity} />
                    due {formatDate(issue.due_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Same style as the audit trail on an issue page, plus which issue it was */}
      <section className="space-y-3">
        <h2 className="font-semibold">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted">No activity yet.</p>
        ) : (
          <ul className="text-sm">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="border-b border-line py-2">
                <span className="text-muted">{formatDateTime(entry.created_at)} · </span>
                {entry.actor.full_name} · {entry.action} ·{" "}
                <Link href={`/issues/${entry.issue.id}`} className="hover:text-violet-300">
                  #{entry.issue.id} {entry.issue.title}
                </Link>
                {entry.description && entry.action !== "created" && (
                  <span className="text-muted"> · {entry.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
