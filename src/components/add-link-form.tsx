"use client";

import { useActionState } from "react";
import { addEvidenceLink, type AddLinkState } from "@/app/issues/actions";

const initialState: AddLinkState = {
  success: false,
  error: "",
  values: { name: "", url: "" },
};

const inputClass = "w-full rounded-lg border border-line bg-page p-2";

// A small form that adds a link as evidence, for example
// label "IT ticket #482" and link "https://it.example.com/482".
export default function AddLinkForm({ issueId }: { issueId: number }) {
  // addEvidenceLink needs the issue id first; bind fills it in.
  const addLinkToThisIssue = addEvidenceLink.bind(null, issueId);
  const [state, formAction, pending] = useActionState(addLinkToThisIssue, initialState);

  return (
    <form action={formAction} className="space-y-2">
      {state.error && (
        <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{state.error}</p>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input
          name="name"
          placeholder="Label"
          aria-label="Link label"
          required
          defaultValue={state.values.name}
          className={inputClass}
        />
        <input
          name="url"
          type="url"
          placeholder="https://"
          aria-label="Link"
          required
          defaultValue={state.values.url}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-line disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add link"}
        </button>
      </div>
    </form>
  );
}
