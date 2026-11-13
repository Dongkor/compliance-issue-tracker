export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type IssueSeverity = "low" | "medium" | "high" | "critical";

// The fields isCompleted and isOverdue need, for example
// { status: "open", due_date: "2026-11-10" }.
type IssueDates = {
  status: IssueStatus;
  due_date: string;
};

// An issue counts as completed when it is resolved or closed.
export function isCompleted(issue: { status: IssueStatus }): boolean {
  return issue.status === "resolved" || issue.status === "closed";
}

// An issue is overdue when its due date is before today and it is not completed.
// Dates are compared as text ("2026-11-10" < "2026-11-13"), which works because
// the format is year-month-day.
export function isOverdue(issue: IssueDates): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return !isCompleted(issue) && issue.due_date < today;
}

// The fields canEditIssue needs, for example
// { status: "open", reported_by: "4f3a...", owner_id: null }.
type IssueAccess = {
  status: IssueStatus;
  reported_by: string;
  owner_id: string | null;
};

// Admins can edit any issue. Members can edit an issue they reported or own,
// as long as it is not resolved or closed yet (only admins change completed issues).
export function canEditIssue(
  user: { id: string; role: "member" | "admin" },
  issue: IssueAccess
): boolean {
  if (user.role === "admin") {
    return true;
  }
  if (isCompleted(issue)) {
    return false;
  }
  if (issue.reported_by === user.id || issue.owner_id === user.id) {
    return true;
  }
  return false;
}

// Turns a status into readable text, for example "in_progress" → "In progress".
export function statusLabel(status: IssueStatus): string {
  if (status === "in_progress") {
    return "In progress";
  }
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Formats a date and time for display,
// for example "2026-11-13T01:30:00+00:00" → "13 Nov 2026, 09:30" (in Philippine time).
export function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}

// Formats a date for display, for example "2026-11-10" → "10 Nov 2026".
export function formatDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
