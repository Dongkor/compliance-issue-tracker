"use client";

import { useActionState, useRef, useState } from "react";
import { createToken, revokeToken, type CreateTokenState } from "@/app/tokens/actions";
import { formatDate } from "@/lib/issues";

// One row of the token list. The hash is never sent to the browser.
export type TokenRow = {
  id: number;
  name: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

const initialState: CreateTokenState = { error: "", token: "" };

// The "API tokens" button and popup on the dashboard (admins only).
// Admins create a token (shown once), see when each one was last used,
// and revoke tokens that are no longer needed.
export default function ApiTokensDialog({ tokens }: { tokens: TokenRow[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // The new token is kept here only while the popup is open,
  // so it disappears for good once the popup is closed.
  const [visibleToken, setVisibleToken] = useState("");
  // This site's address, for example "http://localhost:3000", used in the config snippet.
  const [appUrl, setAppUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Runs the Server Action, then shows the new token if it worked.
  async function create(previousState: CreateTokenState, formData: FormData) {
    const result = await createToken(previousState, formData);
    setVisibleToken(result.token);
    setAppUrl(window.location.origin);
    setCopied(false);
    return result;
  }

  const [state, formAction, pending] = useActionState(create, initialState);

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    setVisibleToken("");
    dialogRef.current?.close();
  }

  async function copyToken() {
    await navigator.clipboard.writeText(visibleToken);
    setCopied(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-line hover:cursor-pointer"
      >
        API tokens
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setVisibleToken("")}
        className="m-auto w-full max-w-4xl rounded-2xl border border-line bg-card p-6 text-inherit backdrop:bg-black/60"
      >
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">API tokens</h2>
          <p className="text-sm text-muted">
            Tokens let an AI app use this tracker through the MCP server. Each token is
            shown only once.
          </p>

          <form action={formAction} className="flex gap-2">
            <input
              name="name"
              placeholder="Name"
              aria-label="Token name"
              required
              className="w-full rounded-lg border border-line bg-page p-2 text-sm"
            />
            <button
              type="submit"
              disabled={pending}
              className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {pending ? "Creating..." : "Create token"}
            </button>
          </form>

          {state.error && (
            <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{state.error}</p>
          )}

          {visibleToken && (
            <div className="space-y-2 rounded-lg border border-accent bg-accent/10 p-3 text-sm">
              <p>Copy this token now. It won&apos;t be shown again.</p>
              <div className="flex gap-2">
                <code className="block w-full overflow-x-auto rounded bg-page p-2 text-xs">
                  {visibleToken}
                </code>
                <button
                  type="button"
                  onClick={copyToken}
                  className="shrink-0 rounded-lg border border-line px-3 text-xs hover:bg-line"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-muted">
                Add it to your AI app&apos;s MCP server settings (for example Claude
                Desktop&apos;s config file) as environment variables:
              </p>
              <pre className="overflow-x-auto rounded bg-page p-2 text-xs">
                {`"env": {
  "APP_URL": "${appUrl}",
  "AGENT_API_TOKEN": "${visibleToken}"
}`}
              </pre>
              <p className="text-muted">Full setup steps are in the README, under &quot;MCP server&quot;.</p>
            </div>
          )}

          {tokens.length === 0 ? (
            <p className="text-sm text-muted">No tokens yet.</p>
          ) : (
            <ul className="text-sm">
              {tokens.map((token) => (
                <li
                  key={token.id}
                  className="flex items-center justify-between gap-3 border-b border-line py-2"
                >
                  <span>
                    {token.name}
                    <span className="text-muted">
                      {" "}
                      · created {formatDate(token.created_at.slice(0, 10))} ·{" "}
                      {token.last_used_at
                        ? `last used ${formatDate(token.last_used_at.slice(0, 10))}`
                        : "never used"}
                    </span>
                  </span>
                  {token.revoked_at ? (
                    <span className="shrink-0 text-muted">Revoked</span>
                  ) : (
                    <form action={revokeToken.bind(null, token.id)}>
                      <button
                        type="submit"
                        className="shrink-0 rounded-lg border border-line px-3 py-1 text-xs text-red-300 hover:bg-line"
                      >
                        Revoke
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-lg border border-line px-4 py-2 text-sm text-muted hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
