"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { generateToken, hashToken } from "@/lib/tokens";

// What the "Create token" form gets back. token is the real token,
// filled in only right after creating it (it is never shown again).
export type CreateTokenState = {
  error: string;
  token: string;
};

const tokenNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name for the token")
  .max(100, "Name must be at most 100 characters");

// Creates an API token for the AI agent. Admins only.
// Example: name "Claude" → { error: "", token: "9f2c...a71b" }.
export async function createToken(
  previousState: CreateTokenState,
  formData: FormData
): Promise<CreateTokenState> {
  // 1. Only admins can create tokens.
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return { error: "Only admins can create API tokens.", token: "" };
  }

  // 2. Check the name.
  const result = tokenNameSchema.safeParse(String(formData.get("name") ?? ""));
  if (!result.success) {
    return { error: result.error.issues[0].message, token: "" };
  }

  const supabase = await createClient();

  // 3. Tokens act as the "AI Agent" profile, which must exist first (see seed.sql).
  const { data: agent } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "agent")
    .limit(1)
    .maybeSingle();

  if (!agent) {
    return { error: "The AI Agent profile is missing. Run the agent part of seed.sql first.", token: "" };
  }

  // 4. Make the token and save only its hash.
  const token = generateToken();
  const { error: insertError } = await supabase.from("api_tokens").insert({
    name: result.data,
    token_hash: hashToken(token),
    profile_id: agent.id,
  });

  if (insertError) {
    return { error: "Could not create the token. Try again.", token: "" };
  }

  revalidatePath("/");

  // 5. Return the real token once, so the admin can copy it.
  return { error: "", token: token };
}

// Switches a token off by setting revoked_at. Admins only.
// The row stays, so there is still a record that the token existed.
export async function revokeToken(tokenId: number): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return;
  }

  const supabase = await createClient();
  await supabase
    .from("api_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .is("revoked_at", null);

  revalidatePath("/");
}
