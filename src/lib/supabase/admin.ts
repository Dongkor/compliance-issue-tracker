import { createClient } from "@supabase/supabase-js";

// Creates a Supabase client that uses the SECRET key. It ignores RLS, so it
// can read and write any table. It is used only by the agent API routes
// (src/app/api/agent/...), which check the agent's token first and then do
// only a few fixed things. Never import this in code that runs in the browser:
// SUPABASE_SECRET_KEY has no NEXT_PUBLIC_ prefix, so Next.js keeps it on the server.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      // There is no logged-in user here, so there is no session to keep.
      auth: { persistSession: false },
    }
  );
}
