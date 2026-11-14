import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/tokens";

// Who is calling, once the token is accepted.
// profileId is the "AI Agent" profile, used as actor_id in the audit log.
export type Agent = {
  tokenId: number;
  profileId: string;
};

// Checks the API token sent by the MCP server and returns the agent, or null.
// The request must have the header "Authorization: Bearer <token>".
// Steps: read the token → hash it → find that hash in api_tokens (not revoked)
// → record when it was last used.
export async function getAgentFromRequest(request: Request): Promise<Agent | null> {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  if (token === "") {
    return null;
  }

  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from("api_tokens")
    .select("id, profile_id, revoked_at")
    .eq("token_hash", hashToken(token))
    .maybeSingle();

  if (!row || row.revoked_at) {
    return null;
  }

  // Lets admins see in the API tokens popup when each token was last used.
  await supabase
    .from("api_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", row.id);

  return { tokenId: row.id, profileId: row.profile_id };
}

// The same answer for every rejected token, so a caller can't tell
// "wrong token" apart from "revoked token".
export function unauthorizedResponse(): Response {
  return Response.json({ error: "Invalid or missing API token" }, { status: 401 });
}
