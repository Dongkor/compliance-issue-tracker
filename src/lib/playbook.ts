import { isCompleted, type IssueSeverity, type IssueStatus } from "./issues";

// What the playbook needs to know about an issue. The API route fills this in
// from the database, for example
// { status: "open", severity: "critical", hasOwner: true, evidenceCount: 0, daysOverdue: 3 }.
export type PlaybookInput = {
  status: IssueStatus;
  severity: IssueSeverity;
  hasOwner: boolean;
  evidenceCount: number;
  daysOverdue: number; // 0 when not overdue
};

// What the playbook found and what it would do.
export type PlaybookResult = {
  findings: string[]; // what is true about the issue
  steps: string[]; // recommended next steps for people
  moveToInProgress: boolean; // the one change the playbook makes itself
  readyToResolve: boolean; // recommended only; an admin resolves by hand
};

// The playbook's fixed rules. The same input always gives the same result, and
// nothing is read or saved here (the API route does that), so the rules can be
// tested on their own. Issue text (title, description) is never looked at, so
// it can't change what the playbook does.
export function analyseIssue(issue: PlaybookInput): PlaybookResult {
  const findings: string[] = [];
  const steps: string[] = [];

  // Resolved or closed: nothing left to do.
  if (isCompleted(issue)) {
    findings.push(`Already ${issue.status}. Nothing to do.`);
    return { findings, steps, moveToInProgress: false, readyToResolve: false };
  }

  // Severity
  if (issue.severity === "critical") {
    findings.push("Critical severity.");
    steps.push("Act within 24 hours.");
  } else if (issue.severity === "high") {
    findings.push("High severity.");
    steps.push("Act within a few days.");
  } else {
    findings.push(`${issue.severity === "medium" ? "Medium" : "Low"} severity.`);
  }

  // Owner
  if (!issue.hasOwner) {
    findings.push("No owner.");
    steps.push("An admin should assign an owner.");
  }

  // Due date
  if (issue.daysOverdue > 0) {
    findings.push(`${issue.daysOverdue} day(s) overdue.`);
    steps.push("Tell an admin and agree a new plan with the owner.");
  }

  // Evidence
  if (issue.evidenceCount === 0) {
    findings.push("No evidence yet.");
    steps.push("Add evidence that shows the fix (a file or a link).");
  } else {
    findings.push(`${issue.evidenceCount} evidence item(s).`);
  }

  // Stage. Work starts automatically only when someone is responsible for it.
  const moveToInProgress = issue.status === "open" && issue.hasOwner;

  // Ready to resolve: work has started and there is proof. This is only a
  // recommendation; resolving stays an admin's job.
  const readyToResolve = issue.status === "in_progress" && issue.evidenceCount > 0;
  if (readyToResolve) {
    steps.push("Ready to resolve: an admin should review the evidence and resolve the issue.");
  }

  return { findings, steps, moveToInProgress, readyToResolve };
}
