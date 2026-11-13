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

// How many days past its due date an issue is, for example
// due "2026-11-10" on 13 Nov 2026 → 3. Both dates are read as midnight UTC,
// so the difference is a whole number of days.
export function daysLate(dueDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const difference = new Date(today + "T00:00:00Z").getTime() - new Date(dueDate + "T00:00:00Z").getTime();
  return Math.round(difference / millisecondsPerDay);
}

// Decides whether an issue belongs under a filter (the /issues tabs and the
// dashboard cards), for example an open issue due yesterday matches both
// "open" and "overdue".
export function matchesFilter(issue: IssueDates, filter: string): boolean {
  switch (filter) {
    case "open":
      return issue.status === "open";
    case "in_progress":
      return issue.status === "in_progress";
    case "overdue":
      return isOverdue(issue);
    case "completed":
      return isCompleted(issue);
    default:
      // "all" matches every issue
      return true;
  }
}

// Counts how many issues belong under a filter,
// for example countIssues(issues, "overdue") → 2.
export function countIssues(issues: IssueDates[], filter: string): number {
  let count = 0;
  for (const issue of issues) {
    if (matchesFilter(issue, filter)) {
      count = count + 1;
    }
  }
  return count;
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
