import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  full_name: string;
  role: "member" | "admin";
};

// Returns the logged-in user's profile, for example
// { id: "4f3a...", full_name: "Bob Santos", role: "admin" },
// or null when nobody is logged in or the user has no profile.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", authData.user.id)
    .single();

  return profile;
}
