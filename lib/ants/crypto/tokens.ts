import { randomBytes, createHash, timingSafeEqual } from "crypto";

/** URL-safe random token (default 32 bytes → ~43 chars base64url). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Deterministic SHA-256 hash (hex) for storing/looking up opaque tokens. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
