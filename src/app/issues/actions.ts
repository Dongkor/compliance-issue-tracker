"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { createIssueSchema } from "@/lib/validation";

// What the "New issue" form gets back after submitting.
// The typed values are sent back too, so the form keeps them when there is an error.
export type CreateIssueState = {
  success: boolean;
  error: string;
  values: {
    title: string;
    description: string;
    severity: string;
    due_date: string;
  };
};

const emptyValues = { title: "", description: "", severity: "", due_date: "" };

// Creates a new issue from the "New issue" form, then records it in the audit log.
// Example result on a short title:
// { success: false, error: "Title must be at least 3 characters", values: { ... } }
export async function createIssue(
  previousState: CreateIssueState,
  formData: FormData
): Promise<CreateIssueState> {
  const values = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    severity: String(formData.get("severity") ?? ""),
    due_date: String(formData.get("due_date") ?? ""),
  };

  // 1. Who is asking?
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Your session has expired. Log in again.", values };
  }

  // 2. Check the input.
  const result = createIssueSchema.safeParse(values);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message, values };
  }

  const supabase = await createClient();

  // 3. Save the issue. New issues always start as "open".
  const { data: issue, error: issueError } = await supabase
    .from("issues")
    .insert({
      title: result.data.title,
      description: result.data.description,
      severity: result.data.severity,
      due_date: result.data.due_date,
      reported_by: user.id,
    })
    .select("id")
    .single();

  if (issueError) {
    return { success: false, error: "Could not save the issue. Try again.", values };
  }

  // 4. Record it in the audit log. This is a separate save: if it fails,
  // the issue already exists, so the message says so instead of asking to retry.
  const { error: auditError } = await supabase.from("audit_log").insert({
    issue_id: issue.id,
    actor_id: user.id,
    action: "created",
    description: result.data.title,
  });

  revalidatePath("/issues");

  if (auditError) {
    return {
      success: false,
      error: `Issue #${issue.id} was saved, but its audit entry could not be written.`,
      values: emptyValues,
    };
  }

  // 5. Done: the list refreshes and the popup closes.
  return { success: true, error: "", values: emptyValues };
}
