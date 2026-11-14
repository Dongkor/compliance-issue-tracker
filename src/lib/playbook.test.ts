import { test, expect } from "vitest";
import { analyseIssue, type PlaybookInput } from "./playbook";

// A plain open issue; each test changes only what it is about.
const base: PlaybookInput = {
  status: "open",
  severity: "medium",
  hasOwner: true,
  evidenceCount: 0,
  daysOverdue: 0,
};

test("moves an open issue with an owner to in progress", () => {
  expect(analyseIssue(base).moveToInProgress).toBe(true);
});

test("does not move an open issue with no owner", () => {
  const result = analyseIssue({ ...base, hasOwner: false });
  expect(result.moveToInProgress).toBe(false);
  expect(result.steps).toContain("An admin should assign an owner.");
});

test("recommends resolving when in progress with evidence", () => {
  const result = analyseIssue({ ...base, status: "in_progress", evidenceCount: 1 });
  expect(result.readyToResolve).toBe(true);
});

test("never recommends resolving without evidence", () => {
  const result = analyseIssue({ ...base, status: "in_progress", evidenceCount: 0 });
  expect(result.readyToResolve).toBe(false);
});

test("never recommends resolving before work has started", () => {
  const result = analyseIssue({ ...base, status: "open", evidenceCount: 2 });
  expect(result.readyToResolve).toBe(false);
});

test("reports how many days overdue", () => {
  const result = analyseIssue({ ...base, daysOverdue: 3 });
  expect(result.findings).toContain("3 day(s) overdue.");
});

test("does nothing for a resolved issue", () => {
  const result = analyseIssue({ ...base, status: "resolved", evidenceCount: 1 });
  expect(result.moveToInProgress).toBe(false);
  expect(result.readyToResolve).toBe(false);
  expect(result.steps).toEqual([]);
});
