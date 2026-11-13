"use client";

import { useActionState, useEffect, useRef } from "react";
import { createIssue, type CreateIssueState } from "@/app/issues/actions";

const initialState: CreateIssueState = {
  success: false,
  error: "",
  values: { title: "", description: "", severity: "", due_date: "" },
};

const inputClass = "w-full rounded-lg border border-line bg-page p-2";

// The "New issue" button and its popup form.
// It runs in the browser because it opens and closes the popup.
export default function NewIssueDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Connects the form to the createIssue Server Action.
  // "state" is what the action returned last time (an error, or success).
  // "pending" is true while the form is being saved.
  const [state, formAction, pending] = useActionState(createIssue, initialState);

  // Close the popup after a successful save.
  useEffect(() => {
    if (state.success) {
      dialogRef.current?.close();
    }
  }, [state]);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
      >
        + New issue
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-md rounded-2xl border border-line bg-card p-6 text-inherit backdrop:bg-black/60"
      >
        <form action={formAction} className="space-y-4">
          <h2 className="text-lg font-semibold">New issue</h2>

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
              rows={3}
              defaultValue={state.values.description}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="severity" className="block text-sm text-muted">
                Severity
              </label>
              <select
                id="severity"
                name="severity"
                required
                defaultValue={state.values.severity}
                className={inputClass}
              >
                <option value="" disabled>
                  Choose
                </option>
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
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {pending ? "Saving..." : "Create issue"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
