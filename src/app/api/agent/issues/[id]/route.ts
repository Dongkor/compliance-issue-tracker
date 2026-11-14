import { createAdminClient } from "@/lib/supabase/admin";
import { getAgentFromRequest, unauthorizedResponse } from "@/lib/agent-auth";
import { isOverdue, type IssueSeverity, type IssueStatus } from "@/lib/issues";

type IssueDetail = {
  id: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  due_date: string;
  created_at: string;
  owner: { full_name: string } | null;
  reporter: { full_name: string };
};

type EvidenceRow = {
  type: "link" | "file";
  name: string;
  url: string | null;
  created_at: string;
  adder: { full_name: string };
};

type AuditRow = {
  action: string;
  description: string;
  created_at: string;
  actor: { full_name: string };
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/agent/issues/1
// One issue for the AI agent: its details, evidence and audit trail.
// Evidence files are listed by name only: the agent never gets file contents
// or download links. Needs a valid API token.
export async function GET(request: Request, { params }: RouteContext) {
  // 1. Is this a valid agent token?
  const agent = await getAgentFromRequest(request);
  if (!agent) {
    return unauthorizedResponse();
  }

  // 2. Check the id, for example "/api/agent/issues/abc" is not valid.
  const { id } = await params;
  const issueId = Number(id);
  if (!Number.isInteger(issueId)) {
    return Response.json({ error: "Issue id must be a number" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 3. Load the issue with the owner's and reporter's names.
  const { data: issueData, error: issueError } = await supabase
    .from("issues")
    .select(
      "id, title, description, severity, status, due_date, created_at, " +
        "owner:profiles!issues_owner_id_fkey(full_name), " +
        "reporter:profiles!issues_reported_by_fkey(full_name)"
    )
    .eq("id", issueId)
    .maybeSingle();

  if (issueError) {
    return Response.json({ error: "Could not load the issue" }, { status: 500 });
  }
  if (!issueData) {
    return Response.json({ error: "Issue not found" }, { status: 404 });
  }

  const issue = issueData as unknown as IssueDetail;

  // 4. Load its evidence and audit trail, oldest first (easier to read as a story).
  const { data: evidenceData } = await supabase
    .from("evidence")
    .select("type, name, url, created_at, adder:profiles(full_name)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  const { data: auditData } = await supabase
    .from("audit_log")
    .select("action, description, created_at, actor:profiles(full_name)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });

  const evidenceRows = (evidenceData ?? []) as unknown as EvidenceRow[];
  const auditRows = (auditData ?? []) as unknown as AuditRow[];

  // 5. Put it in a simple shape for the agent.
  const evidence = [];
  for (const item of evidenceRows) {
    evidence.push({
      type: item.type,
      name: item.name,
      url: item.type === "link" ? item.url : null,
      added_by: item.adder.full_name,
      added_at: item.created_at,
    });
  }

  const auditTrail = [];
  for (const entry of auditRows) {
    auditTrail.push({
      at: entry.created_at,
      by: entry.actor.full_name,
      action: entry.action,
      description: entry.description,
    });
  }

  return Response.json({
    issue: {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      due_date: issue.due_date,
      overdue: isOverdue(issue),
      owner: issue.owner ? issue.owner.full_name : null,
      reported_by: issue.reporter.full_name,
      created_at: issue.created_at,
      evidence: evidence,
      audit_trail: auditTrail,
    },
  });
}
