"use client";

import Link from "next/link";
import { useActionState } from "react";
import { updateIssue, type UpdateIssueState } from "@/app/issues/actions";

type EditIssueFormProps = {
  issue: {
    id: number;
    title: string;
    description: string;
    status: string;
    severity: string;
    due_date: string;
    owner_id: string | null;
  };
  people: { id: string; full_name: string }[];
  isAdmin: boolean;
};

const inputClass = "w-full rounded-lg border border-line bg-page p-2 text-white";

// Dropdowns: a 12px transparent right border moves the browser's arrow in from
// the edge; the box-shadow draws the visible right edge instead.
const selectClass =
  "w-full rounded-lg border border-line border-r-4 border-r-transparent bg-page py-2 pl-2 shadow-[1px_0_0_var(--color-line)]";

// The "Edit issue" form. Admins see every field; members only see
// title, description and status (open or in progress).
export default function EditIssueForm({ issue, people, isAdmin }: EditIssueFormProps) {
  const initialState: UpdateIssueState = {
    error: "",
    values: {
      title: issue.title,
      description: issue.description,
      status: issue.status,
      severity: issue.severity,
      due_date: issue.due_date,
      owner_id: issue.owner_id ?? "",
    },
  };

  // updateIssue needs the issue id first. bind(null, issue.id) makes a new
  // function with the id already filled in, so the form only passes its data.
  const updateThisIssue = updateIssue.bind(null, issue.id);
  const [state, formAction, pending] = useActionState(updateThisIssue, initialState);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-line bg-card p-6"
    >
      {state.error && (
        <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{state.error}</p>
      )}

      <div className="space-y-1">
        <label htmlFor="title" className="block text-sm text-muted">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={state.values.title}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="description" className="block text-sm text-muted">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={state.values.description}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="status" className="block text-sm text-muted">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={state.values.status}
          className={selectClass}
        >
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          {isAdmin && <option value="resolved">Resolved</option>}
          {isAdmin && <option value="closed">Closed</option>}
        </select>
      </div>

      {isAdmin && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="severity" className="block text-sm text-muted">
              Severity
            </label>
            <select
              id="severity"
              name="severity"
              defaultValue={state.values.severity}
              className={selectClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="due_date" className="block text-sm text-muted">
              Due date
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              required
              defaultValue={state.values.due_date}
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="owner_id" className="block text-sm text-muted">
              Owner
            </label>
            <select
              id="owner_id"
              name="owner_id"
              defaultValue={state.values.owner_id}
              className={selectClass}
            >
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!isAdmin && (
        <p className="text-sm text-muted">
          Only admins can change severity, due date and owner, or resolve the issue.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Link
          href={`/issues/${issue.id}`}
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-white"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
