"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { createIssueSchema, updateIssueSchema } from "@/lib/validation";
import { canEditIssue, formatDate, statusLabel } from "@/lib/issues";

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

// What the "Edit issue" form gets back when something goes wrong.
// The typed values are sent back so the form keeps them.
export type UpdateIssueState = {
  error: string;
  values: {
    title: string;
    description: string;
    status: string;
    severity: string;
    due_date: string;
    owner_id: string;
  };
};

// Finds a person's name in a list of profiles, for example
// findName(people, "4f3a...") → "Eve Cruz", findName(people, null) → "Unassigned".
function findName(
  people: { id: string; full_name: string }[],
  profileId: string | null
): string {
  if (!profileId) {
    return "Unassigned";
  }
  for (const person of people) {
    if (person.id === profileId) {
      return person.full_name;
    }
  }
  return "Unknown";
}

// Saves changes from the "Edit issue" form, then records what changed in the audit log.
// issueId comes first because the form binds it: updateIssue.bind(null, 12).
// Example audit description: "status: Open → In progress; owner: Unassigned → Eve Cruz".
export async function updateIssue(
  issueId: number,
  previousState: UpdateIssueState,
  formData: FormData
): Promise<UpdateIssueState> {
  const values = {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? ""),
    severity: String(formData.get("severity") ?? ""),
    due_date: String(formData.get("due_date") ?? ""),
    owner_id: String(formData.get("owner_id") ?? ""),
  };

  // 1. Who is asking, and may they edit this issue?
  // The issue is loaded from the database: the form is never trusted for this.
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Your session has expired. Log in again.", values };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("issues")
    .select("title, description, status, severity, due_date, owner_id, reported_by")
    .eq("id", issueId)
    .maybeSingle();

  if (!current) {
    return { error: "This issue no longer exists.", values };
  }

  if (!canEditIssue(user, current)) {
    return { error: "You can't edit this issue.", values };
  }

  // 2. Members cannot change severity, due date or owner, so the current
  // values are kept no matter what the form sent.
  if (user.role !== "admin") {
    values.severity = current.severity;
    values.due_date = current.due_date;
    values.owner_id = current.owner_id ?? "";
  }

  // 3. Check the input.
  const result = updateIssueSchema.safeParse(values);
  if (!result.success) {
    return { error: result.error.issues[0].message, values };
  }

  const newStatus = result.data.status;
  if (user.role !== "admin" && (newStatus === "resolved" || newStatus === "closed")) {
    return { error: "Only admins can resolve or close issues.", values };
  }

  let newOwnerId: string | null = null;
  if (result.data.owner_id !== "") {
    newOwnerId = result.data.owner_id;
  }

  // 4. Work out what changed, for example "status: Open → In progress".
  const changes: string[] = [];

  if (result.data.title !== current.title) {
    changes.push(`title: ${current.title} → ${result.data.title}`);
  }
  if (result.data.description !== current.description) {
    changes.push("description changed");
  }
  if (newStatus !== current.status) {
    changes.push(`status: ${statusLabel(current.status)} → ${statusLabel(newStatus)}`);
  }
  if (result.data.severity !== current.severity) {
    changes.push(`severity: ${current.severity} → ${result.data.severity}`);
  }
  if (result.data.due_date !== current.due_date) {
    changes.push(`due date: ${formatDate(current.due_date)} → ${formatDate(result.data.due_date)}`);
  }
  if (newOwnerId !== current.owner_id) {
    const { data: people } = await supabase.from("profiles").select("id, full_name");
    const peopleList = people ?? [];
    changes.push(
      `owner: ${findName(peopleList, current.owner_id)} → ${findName(peopleList, newOwnerId)}`
    );
  }

  if (changes.length === 0) {
    return { error: "Nothing to save.", values };
  }

  // 5. Save the changes.
  const { error: updateError } = await supabase
    .from("issues")
    .update({
      title: result.data.title,
      description: result.data.description,
      status: newStatus,
      severity: result.data.severity,
      due_date: result.data.due_date,
      owner_id: newOwnerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId);

  if (updateError) {
    return { error: "Could not save the changes. Try again.", values };
  }

  // 6. Record the changes in the audit log (a separate save, like createIssue).
  const { error: auditError } = await supabase.from("audit_log").insert({
    issue_id: issueId,
    actor_id: user.id,
    action: "updated",
    description: changes.join("; "),
  });

  revalidatePath("/issues");
  revalidatePath(`/issues/${issueId}`);

  if (auditError) {
    return { error: "The changes were saved, but the audit entry could not be written.", values };
  }

  // 7. Go back to the issue page, where the new audit entry shows.
  redirect(`/issues/${issueId}`);
}
