import { createHash, randomBytes } from "crypto";

// Makes a new API token: 32 random bytes written as 64 hex characters,
// for example "9f2c4e...a71b". It is shown to the admin once and never stored.
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// Turns a token into its SHA-256 hash (64 hex characters). Only the hash is
// stored in api_tokens. Hashing is one-way: the hash can't be turned back
// into the token, so a leaked table doesn't reveal any working token.
// The same token always gives the same hash, which is how incoming tokens are checked.
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
