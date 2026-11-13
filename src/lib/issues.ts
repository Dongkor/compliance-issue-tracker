export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type IssueSeverity = "low" | "medium" | "high" | "critical";

// The fields the helpers below need, for example
// { status: "open", due_date: "2026-11-10" }.
type IssueDates = {
  status: IssueStatus;
  due_date: string;
};

// An issue counts as completed when it is resolved or closed.
export function isCompleted(issue: IssueDates): boolean {
  return issue.status === "resolved" || issue.status === "closed";
}

// An issue is overdue when its due date is before today and it is not completed.
// Dates are compared as text ("2026-11-10" < "2026-11-13"), which works because
// the format is year-month-day.
export function isOverdue(issue: IssueDates): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return !isCompleted(issue) && issue.due_date < today;
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
