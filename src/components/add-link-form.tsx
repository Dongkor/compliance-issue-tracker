"use client";

import { useActionState, useState } from "react";
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
  // The typed label and link, kept in state so the button can be
  // disabled until both are filled in.
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  // Runs the Server Action for this issue, then clears the fields if it worked.
  async function addLink(previousState: AddLinkState, formData: FormData) {
    const result = await addEvidenceLink(issueId, previousState, formData);
    if (result.success) {
      setName("");
      setUrl("");
    }
    return result;
  }

  const [state, formAction, pending] = useActionState(addLink, initialState);

  const isEmpty = name.trim() === "" || url.trim() === "";

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
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
        <input
          name="url"
          type="url"
          placeholder="https://"
          aria-label="Link"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending || isEmpty}
          className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-line hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-line"
        >
          {pending ? "Adding..." : "Add link"}
        </button>
      </div>
    </form>
  );
}
