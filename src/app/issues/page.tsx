import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SeverityBadge from "@/components/severity-badge";
import {
  formatDate,
  isCompleted,
  isOverdue,
  statusLabel,
  type IssueSeverity,
  type IssueStatus,
} from "@/lib/issues";

// One row of the issue list, as returned by the query below.
type IssueRow = {
  id: number;
  title: string;
  severity: IssueSeverity;
  status: IssueStatus;
  due_date: string;
  owner: { full_name: string } | null;
};

// The pill tabs above the table. Each one links to /issues?status=<value>.
const filters = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "overdue", label: "Overdue" },
  { value: "completed", label: "Completed" },
];

// Decides whether an issue belongs under a tab, for example
// an open issue due yesterday matches both "open" and "overdue".
function matchesFilter(issue: IssueRow, filter: string): boolean {
  switch (filter) {
    case "open":
      return issue.status === "open";
    case "in_progress":
      return issue.status === "in_progress";
    case "overdue":
      return isOverdue(issue);
    case "completed":
      return isCompleted(issue);
    default:
      // "all" shows every issue
      return true;
  }
}

// Counts how many issues belong under a tab,
// for example countIssues(issues, "overdue") → 2.
function countIssues(issues: IssueRow[], filter: string): number {
  let count = 0;
  for (const issue of issues) {
    if (matchesFilter(issue, filter)) {
      count = count + 1;
    }
  }
  return count;
}

type IssuesPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const { status } = await searchParams;
  const activeFilter = status ?? "all";

  const supabase = await createClient();
  // "issues" links to "profiles" twice (owner_id and reported_by), so the
  // query names the link to use for the owner: issues_owner_id_fkey.
  const { data, error } = await supabase
    .from("issues")
    .select("id, title, severity, status, due_date, owner:profiles!issues_owner_id_fkey(full_name)")
    .order("id", { ascending: false });

  if (error) {
    return (
      <main className="flex-1 p-4 sm:p-6">
        <p className="text-red-300">Could not load issues. Try again later.</p>
      </main>
    );
  }

  // Without generated database types, Supabase guesses that "owner" is a list.
  // Each issue has at most one owner, so Supabase actually returns one object
  // (or null). "as unknown as" tells TypeScript to use the IssueRow type instead.
  const issues = data as unknown as IssueRow[];

  // Keep only the issues that belong under the selected tab.
  const visibleIssues: IssueRow[] = [];
  for (const issue of issues) {
    if (matchesFilter(issue, activeFilter)) {
      visibleIssues.push(issue);
    }
  }

  return (
    <main className="flex-1 space-y-4 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold">Issues</h1>

      <nav className="flex flex-wrap gap-2 text-sm">
        {filters.map((filter) => {
          const count = countIssues(issues, filter.value);
          const isActive = filter.value === activeFilter;

          return (
            <Link
              key={filter.value}
              href={filter.value === "all" ? "/issues" : `/issues?status=${filter.value}`}
              className={
                isActive
                  ? "rounded-full border border-accent bg-accent/15 px-3 py-1 text-white"
                  : "rounded-full border border-line bg-card px-3 py-1 text-muted hover:text-white"
              }
            >
              {filter.label} <span className="text-muted">{count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr>
              <th className="px-4 py-3 font-normal">Id</th>
              <th className="px-4 py-3 font-normal">Title</th>
              <th className="px-4 py-3 font-normal">Severity</th>
              <th className="px-4 py-3 font-normal">Status</th>
              <th className="hidden px-4 py-3 font-normal sm:table-cell">Owner</th>
              <th className="px-4 py-3 font-normal">Due</th>
            </tr>
          </thead>
          <tbody>
            {visibleIssues.map((issue) => (
              <tr key={issue.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 text-muted">{issue.id}</td>
                <td className="px-4 py-3">
                  <Link href={`/issues/${issue.id}`} className="hover:text-violet-300">
                    {issue.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <SeverityBadge severity={issue.severity} />
                </td>
                <td className="whitespace-nowrap px-4 py-3">{statusLabel(issue.status)}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {issue.owner ? issue.owner.full_name : <span className="text-muted">Unassigned</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  {isOverdue(issue) ? (
                    <span className="text-red-300">{formatDate(issue.due_date)} · overdue</span>
                  ) : (
                    formatDate(issue.due_date)
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visibleIssues.length === 0 && (
          <p className="px-4 py-8 text-center text-muted">No issues here.</p>
        )}
      </div>
    </main>
  );
}
