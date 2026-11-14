"use client";

import { useActionState, useState } from "react";
import { addEvidenceFile, type AddFileState } from "@/app/issues/actions";

const initialState: AddFileState = { success: false, error: "" };

// A small form that uploads a file as evidence.
// The "accept" list only filters the file picker; the server checks again.
export default function AddFileForm({ issueId }: { issueId: number }) {
  // addEvidenceFile needs the issue id first; bind fills it in.
  const addFileToThisIssue = addEvidenceFile.bind(null, issueId);
  const [state, formAction, pending] = useActionState(addFileToThisIssue, initialState);

  // Whether a file is chosen, so the button stays disabled until one is.
  const [hasFile, setHasFile] = useState(false);

  return (
    // After every submit React clears the form, which fires "reset":
    // the file input is empty again, so the button goes back to disabled.
    <form action={formAction} onReset={() => setHasFile(false)} className="space-y-2">
      {state.error && (
        <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{state.error}</p>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          name="file"
          type="file"
          aria-label="Evidence file"
          required
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={(event) => {
            const files = event.target.files;
            setHasFile(files !== null && files.length > 0);
          }}
          className="w-full rounded-lg border border-line bg-page p-2 text-sm text-muted file:mr-3 hover:cursor-pointer file:rounded-md file:border-0 file:bg-line file:px-3 file:py-1 file:text-white"
        />
        <button
          type="submit"
          disabled={pending || !hasFile}
          className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-line hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-line"
        >
          {pending ? "Uploading..." : "Upload file"}
        </button>
      </div>
      <p className="text-xs text-muted">PDF, PNG, JPEG or text, up to 4 MB.</p>
    </form>
  );
}
