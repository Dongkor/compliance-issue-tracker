import { createAdminClient } from "@/lib/supabase/admin";
import { getAgentFromRequest, unauthorizedResponse } from "@/lib/agent-auth";
import { isOverdue, matchesFilter, type IssueSeverity, type IssueStatus } from "@/lib/issues";

// The same filters as the /issues tabs.
const allowedFilters = ["all", "open", "in_progress", "overdue", "completed"];

// One issue, as returned by the query below.
type IssueRow = {
  id: number;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  due_date: string;
  owner: { full_name: string } | null;
};

// GET /api/agent/issues?status=overdue
// Lists issues for the AI agent (the MCP server). Needs a valid API token.
// Example answer: { "issues": [{ "id": 1, "title": "...", "overdue": true, "owner": "Eve Cruz", ... }] }
export async function GET(request: Request) {
  // 1. Is this a valid agent token?
  const agent = await getAgentFromRequest(request);
  if (!agent) {
    return unauthorizedResponse();
  }

  // 2. Check the filter.
  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";
  if (!allowedFilters.includes(status)) {
    return Response.json(
      { error: `status must be one of: ${allowedFilters.join(", ")}` },
      { status: 400 }
    );
  }

  // 3. Load the issues with the owner's name.
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("issues")
    .select("id, title, description, severity, status, due_date, owner:profiles!issues_owner_id_fkey(full_name)")
    .order("id", { ascending: true });

  if (error) {
    return Response.json({ error: "Could not load issues" }, { status: 500 });
  }

  // See the note in src/app/issues/page.tsx about "as unknown as".
  const issues = data as unknown as IssueRow[];

  // 4. Keep the issues under the chosen filter, in a simple shape for the agent.
  const result = [];
  for (const issue of issues) {
    if (matchesFilter(issue, status)) {
      result.push({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        severity: issue.severity,
        status: issue.status,
        due_date: issue.due_date,
        overdue: isOverdue(issue),
        owner: issue.owner ? issue.owner.full_name : null,
      });
    }
  }

  return Response.json({ issues: result });
}
