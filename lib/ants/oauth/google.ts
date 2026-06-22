import { createHash } from "crypto";
import { sql } from "../db";
import { generateToken } from "../crypto/tokens";
import { decrypt } from "../crypto/encryption";
import { getConfig, googleConfigured } from "../config";
import { Errors } from "../errors";
import type { Application, Environment } from "../apps";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";
const STATE_TTL_MS = 10 * 60 * 1000;

function callbackUrl(): string {
  return `${getConfig().ANTS_BASE_URL}/api/v1/auth/oauth/google/callback`;
}

/** Resolve the Google client credentials for an app (per-app, else platform). */
function credentials(app: Application): { clientId: string; clientSecret: string } {
  const g = app.settings.google;
  if (g?.enabled && g.client_id && g.client_secret_enc) {
    return { clientId: g.client_id, clientSecret: decrypt(g.client_secret_enc) };
  }
  const cfg = getConfig();
  if (!googleConfigured()) throw Errors.invalidRequest("Google sign-in is not configured");
  return { clientId: cfg.GOOGLE_CLIENT_ID!, clientSecret: cfg.GOOGLE_CLIENT_SECRET! };
}

function challenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Build the Google authorization URL and persist PKCE/CSRF state. `redirectTo`
 * is where the user is sent after Ants finishes; it must be allow-listed by the app.
 */
export async function buildGoogleAuthUrl(
  app: Application,
  environment: Environment,
  redirectTo: string,
): Promise<string> {
  const allowed = app.settings.redirect_uris ?? [];
  if (!allowed.includes(redirectTo)) {
    throw Errors.invalidRequest("redirect_uri is not allow-listed for this application");
  }
  const { clientId } = credentials(app);
  const state = generateToken(24);
  const verifier = generateToken(48);
  await sql`
    insert into oauth_states (state, application_id, environment, provider, code_verifier, redirect_uri, expires_at)
    values (${state}, ${app.id}, ${environment}, 'google', ${verifier}, ${redirectTo},
            ${new Date(Date.now() + STATE_TTL_MS)})
  `;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge(verifier),
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "select_account",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export type GoogleProfile = {
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
};

export type CallbackResult = {
  applicationId: string;
  environment: Environment;
  redirectTo: string;
  profile: GoogleProfile;
};

/** Validate state, exchange the code (with PKCE), and fetch the user profile. */
export async function handleGoogleCallback(
  state: string,
  code: string,
): Promise<CallbackResult> {
  const rows = await sql<
    {
      application_id: string;
      environment: Environment;
      code_verifier: string;
      redirect_uri: string;
      expires_at: string;
    }[]
  >`
    delete from oauth_states where state = ${state} and provider = 'google'
    returning application_id, environment, code_verifier, redirect_uri, expires_at
  `;
  const st = rows[0];
  if (!st || new Date(st.expires_at) <= new Date()) {
    throw Errors.invalidRequest("Invalid or expired OAuth state");
  }

  const appRows = await sql<Application[]>`select * from applications where id = ${st.application_id}`;
  const app = appRows[0];
  if (!app) throw Errors.invalidRequest("Application no longer exists");
  const { clientId, clientSecret } = credentials(app);

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
    applicationId: st.application_id,
    environment: st.environment,
    redirectTo: st.redirect_uri,
    profile: {
      providerUserId: info.sub,
      email: info.email.toLowerCase(),
      emailVerified: Boolean(info.email_verified),
      name: info.name ?? null,
      picture: info.picture ?? null,
    },
  };
}
