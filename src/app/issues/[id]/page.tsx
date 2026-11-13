import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import SeverityBadge from "@/components/severity-badge";
import {
  canEditIssue,
  formatDate,
  formatDateTime,
  isOverdue,
  statusLabel,
  type IssueSeverity,
  type IssueStatus,
} from "@/lib/issues";

// One issue, as returned by the query below.
type IssueDetail = {
  id: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  due_date: string;
  owner_id: string | null;
  reported_by: string;
  owner: { full_name: string } | null;
  reporter: { full_name: string };
};

// One row of the audit trail, for example
// { action: "updated", description: "status: open → in_progress", actor: { full_name: "Bob Santos" } }.
type AuditEntry = {
  id: number;
  action: string;
  description: string;
  created_at: string;
  actor: { full_name: string };
};

type IssuePageProps = {
  params: Promise<{ id: string }>;
};

export default async function IssuePage({ params }: IssuePageProps) {
  const { id } = await params;

  // "/issues/abc" is not a valid issue number.
  const issueId = Number(id);
  if (!Number.isInteger(issueId)) {
    notFound();
  }

  const supabase = await createClient();

  // "issues" links to "profiles" twice, so each link is named:
  // the owner through owner_id, the reporter through reported_by.
  const { data: issueData } = await supabase
    .from("issues")
    .select(
      "id, title, description, severity, status, due_date, owner_id, reported_by, " +
        "owner:profiles!issues_owner_id_fkey(full_name), " +
        "reporter:profiles!issues_reported_by_fkey(full_name)"
    )
    .eq("id", issueId)
    .maybeSingle();

  if (!issueData) {
    notFound();
  }

  // See the note in src/app/issues/page.tsx: without generated database
  // types, Supabase guesses the joined names are lists.
  const issue = issueData as unknown as IssueDetail;

  const { data: auditData } = await supabase
    .from("audit_log")
    .select("id, action, description, created_at, actor:profiles(full_name)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: false });

  const auditEntries = (auditData ?? []) as unknown as AuditEntry[];

  // Show the Edit button only to people allowed to edit this issue.
  const user = await getCurrentUser();
  let showEditButton = false;
  if (user && canEditIssue(user, issue)) {
    showEditButton = true;
  }

  return (
    <main className="flex-1 space-y-4 p-4 sm:p-6">
      <div>
        <Link href="/issues" className="text-sm text-muted hover:text-white">
          ←
          <span className="ml-1 hover:underline hover:underline-offset-2">Issues</span>
        </Link>
      </div>

      {/* Issue card. Two columns: title and description on the left (col-start-1,
          so they stay there even without a button); the Edit button on the right
          spans both rows, so it sits centred between them. */}
      <section className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 rounded-2xl border border-line bg-card p-5">
        <h1 className="col-start-1 text-2xl font-semibold">
          <span className="text-muted">#{issue.id}</span> {issue.title}
        </h1>
        {showEditButton && (
          <Link
            href={`/issues/${issue.id}/edit`}
            className="row-span-2 self-center whitespace-nowrap rounded-lg border border-line px-4 py-2 text-sm hover:bg-line"
          >
            Edit issue
          </Link>
        )}
        {issue.description ? (
          <p className="col-start-1 whitespace-pre-wrap text-muted">{issue.description}</p>
        ) : (
          <p className="col-start-1 text-muted">No description.</p>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* Details card: left column on large screens, above the audit trail on phones */}
        <aside className="h-fit space-y-3 rounded-2xl border border-line bg-card p-5 text-sm">
          <div>
            <p className="text-muted">Severity</p>
            <SeverityBadge severity={issue.severity} />
          </div>
          <div>
            <p className="text-muted">Status</p>
            <p>{statusLabel(issue.status)}</p>
          </div>
          <div>
            <p className="text-muted">Owner</p>
            <p>{issue.owner ? issue.owner.full_name : "Unassigned"}</p>
          </div>
          <div>
            <p className="text-muted">Due date</p>
            {isOverdue(issue) ? (
              <p className="text-red-300">{formatDate(issue.due_date)} · overdue</p>
            ) : (
              <p>{formatDate(issue.due_date)}</p>
            )}
          </div>
          <div>
            <p className="text-muted">Reported by</p>
            <p>{issue.reporter.full_name}</p>
          </div>
        </aside>

        {/* Audit trail: right side on large screens */}
        <section className="space-y-3 lg:col-span-3">
          <h2 className="font-semibold">Audit trail</h2>
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted">No changes recorded yet.</p>
          ) : (
            <ul className="text-sm">
              {auditEntries.map((entry) => (
                <li key={entry.id} className="border-b border-line py-2">
                  <span className="text-muted">{formatDateTime(entry.created_at)} · </span>
                  {entry.actor.full_name} · {entry.action}
                  {entry.description && (
                    <span className="text-muted"> · {entry.description}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
