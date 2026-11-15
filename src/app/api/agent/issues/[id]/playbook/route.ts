import { createAdminClient } from "@/lib/supabase/admin";
import { getAgentFromRequest, unauthorizedResponse } from "@/lib/agent-auth";
import { daysLate, isOverdue, type IssueSeverity, type IssueStatus } from "@/lib/issues";
import { analyseIssue, type PlaybookResult } from "@/lib/playbook";
import { playbookRunSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Turns the result into the note for the audit trail, one item per line, for example
// "Findings:\n- Critical severity.\n- No evidence yet.\nSteps:\n- Act within 24 hours."
function playbookNote(result: PlaybookResult): string {
  const lines: string[] = ["Findings:"];
  for (const finding of result.findings) {
    lines.push(`- ${finding}`);
  }
  if (result.steps.length > 0) {
    lines.push("Steps:");
    for (const step of result.steps) {
      lines.push(`- ${step}`);
    }
  }
  return lines.join("\n");
}

// POST /api/agent/issues/1/playbook   body: { "apply": false }
// Runs the resolution playbook on one issue (rules in src/lib/playbook.ts).
// apply false (dry run): only returns what the playbook found and would do.
// apply true: also moves an open issue with an owner to in progress and adds
// the findings to the audit trail as "AI Agent · playbook".
// It never resolves an issue; it only recommends it. Needs a valid API token.
export async function POST(request: Request, { params }: RouteContext) {
  // 1. Is this a valid agent token?
  const agent = await getAgentFromRequest(request);
  if (!agent) {
    return unauthorizedResponse();
  }

  // 2. Check the id.
  const { id } = await params;
  const issueId = Number(id);
  if (!Number.isInteger(issueId)) {
    return Response.json({ error: "Issue id must be a number" }, { status: 400 });
  }

  // 3. Read and check the body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON, for example { \"apply\": false }" }, { status: 400 });
  }

  const parsed = playbookRunSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const apply = parsed.data.apply;

  const supabase = createAdminClient();

  // 4. Load the issue and count its evidence.
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .select("id, status, severity, due_date, owner_id")
    .eq("id", issueId)
    .maybeSingle();

  if (issueError) {
    return Response.json({ error: "Could not load the issue" }, { status: 500 });
  }
  if (!issue) {
    return Response.json({ error: "Issue not found" }, { status: 404 });
  }

  const { count: evidenceCount } = await supabase
    .from("evidence")
    .select("id", { count: "exact", head: true })
    .eq("issue_id", issueId);

  // 5. Run the rules. Only facts go in: no title or description, so issue text
  // can't change what the playbook does.
  const status = issue.status as IssueStatus;
  const result = analyseIssue({
    status: status,
    severity: issue.severity as IssueSeverity,
    hasOwner: issue.owner_id !== null,
    evidenceCount: evidenceCount ?? 0,
    daysOverdue: isOverdue({ status, due_date: issue.due_date }) ? daysLate(issue.due_date) : 0,
  });

  // 6. Dry run: report only, nothing is saved.
  if (!apply) {
    return Response.json({ applied: false, ...result });
  }

  // 7. Apply: move open → in progress if the rules say so.
  // .eq("status", "open") makes sure it only moves if it's still open right now.
  if (result.moveToInProgress) {
    const { error: updateError } = await supabase
      .from("issues")
      .update({ status: "in_progress", updated_at: new Date().toISOString() })
      .eq("id", issueId)
      .eq("status", "open");

    if (updateError) {
      return Response.json({ error: "Could not update the issue" }, { status: 500 });
    }

    await supabase.from("audit_log").insert({
      issue_id: issueId,
      actor_id: agent.profileId,
      action: "updated",
      description: "status: open → in_progress",
    });
  }

  // 8. Apply: record the findings and steps in the audit trail.
  const { error: noteError } = await supabase.from("audit_log").insert({
    issue_id: issueId,
    actor_id: agent.profileId,
    action: "playbook",
    description: playbookNote(result),
  });

  if (noteError) {
    return Response.json({ error: "Could not save the playbook note" }, { status: 500 });
  }

  return Response.json({ applied: true, ...result });
}
