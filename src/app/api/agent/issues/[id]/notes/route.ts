import { createAdminClient } from "@/lib/supabase/admin";
import { getAgentFromRequest, unauthorizedResponse } from "@/lib/agent-auth";
import { agentNoteSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST /api/agent/issues/1/notes   body: { "note": "..." }
// Adds the AI agent's note to the issue's audit trail as "AI Agent · agent note".
// The issue itself is not changed. Needs a valid API token.
// Example answer: 201 { "ok": true }
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

  // 3. Read and check the body. A body that isn't JSON is a 400, not a crash.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body must be JSON, for example { \"note\": \"...\" }" }, { status: 400 });
  }

  const result = agentNoteSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 4. Does the issue exist?
  const { data: issue } = await supabase
    .from("issues")
    .select("id")
    .eq("id", issueId)
    .maybeSingle();

  if (!issue) {
    return Response.json({ error: "Issue not found" }, { status: 404 });
  }

  // 5. Add the note. actor_id comes from the token, never from the request body,
  // so the agent can't write notes in someone else's name.
  const { error: insertError } = await supabase.from("audit_log").insert({
    issue_id: issueId,
    actor_id: agent.profileId,
    action: "agent note",
    description: result.data.note,
  });

  if (insertError) {
    return Response.json({ error: "Could not save the note" }, { status: 500 });
  }

  // 201 means "created".
  return Response.json({ ok: true }, { status: 201 });
}
