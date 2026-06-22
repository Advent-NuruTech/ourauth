import { createHash } from "crypto";
import { sql } from "../db";
import { generateToken } from "../crypto/tokens";
import { getConfig, googleConfigured } from "../config";
import { Errors } from "../errors";

/**
 * Google sign-in for the Ants PLATFORM itself (developer accounts) — the
 * "Continue with Google" on the dashboard sign-in/up pages. This is separate
 * from lib/ants/oauth/google.ts, which is per-tenant end-user auth. It always
 * uses the platform's own Google credentials and its own callback + state table.
 */
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const STATE_TTL_MS = 10 * 60 * 1000;

function callbackUrl(): string {
  return `${getConfig().ANTS_BASE_URL}/api/auth/google/callback`;
}

function platformCredentials(): { clientId: string; clientSecret: string } {
  if (!googleConfigured()) throw Errors.invalidRequest("Google sign-in is not configured");
  const c = getConfig();
  return { clientId: c.GOOGLE_CLIENT_ID!, clientSecret: c.GOOGLE_CLIENT_SECRET! };
}

function challenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Build the Google authorization URL and persist PKCE/CSRF state. */
export async function buildDeveloperGoogleAuthUrl(): Promise<string> {
  const { clientId } = platformCredentials();
  const state = generateToken(24);
  const verifier = generateToken(48);
  await sql`
    insert into developer_oauth_states (state, provider, code_verifier, expires_at)
    values (${state}, 'google', ${verifier}, ${new Date(Date.now() + STATE_TTL_MS)})
  `;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge(verifier),
    code_challenge_method: "S256",
    access_type: "online",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type DeveloperGoogleProfile = {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
};

/** Validate state, exchange the code (with PKCE), and fetch the Google profile. */
export async function handleDeveloperGoogleCallback(
  state: string,
  code: string,
): Promise<DeveloperGoogleProfile> {
  const rows = await sql<{ code_verifier: string; expires_at: string }[]>`
    delete from developer_oauth_states where state = ${state} and provider = 'google'
    returning code_verifier, expires_at
  `;
  const st = rows[0];
  if (!st || new Date(st.expires_at) <= new Date()) {
    throw Errors.invalidRequest("Invalid or expired sign-in state");
  }

  const { clientId, clientSecret } = platformCredentials();
  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl(),
      grant_type: "authorization_code",
      code_verifier: st.code_verifier,
    }),
  });
  if (!tokenRes.ok) throw Errors.invalidRequest("Google token exchange failed");
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) throw Errors.invalidRequest("Google token exchange failed");

  const infoRes = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) throw Errors.invalidRequest("Failed to fetch Google profile");
  const info = (await infoRes.json()) as {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  return {
    providerUserId: info.sub,
    email: info.email.toLowerCase(),
    emailVerified: Boolean(info.email_verified),
    name: info.name ?? null,
    picture: info.picture ?? null,
  };
}
