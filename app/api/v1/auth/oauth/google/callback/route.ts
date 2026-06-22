import { NextResponse, type NextRequest } from "next/server";
import { handler, Errors } from "@/lib/ants/errors";
import { clientInfo } from "@/lib/ants/request";
import { handleGoogleCallback } from "@/lib/ants/oauth/google";
import { upsertOAuthUser } from "@/lib/ants/auth/users";
import { assignDefaultRoles } from "@/lib/ants/rbac";
import { createSession } from "@/lib/ants/auth/sessions";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Google redirects here. We exchange the code, upsert the user, mint tokens, and
// hand them back to the app via the URL fragment of the app's redirect_to.
export const GET = handler(async (req: NextRequest) => {
  const params = new URL(req.url).searchParams;
  const error = params.get("error");
  if (error) throw Errors.invalidRequest(`Google sign-in failed: ${error}`);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) throw Errors.invalidRequest("Missing code or state");

  const result = await handleGoogleCallback(state, code);
  const user = await upsertOAuthUser({
    applicationId: result.applicationId,
    environment: result.environment,
    provider: "google",
    providerUserId: result.profile.providerUserId,
    email: result.profile.email,
    emailVerified: result.profile.emailVerified,
    fullName: result.profile.name,
    avatarUrl: result.profile.picture,
  });
  await assignDefaultRoles(user.id, result.applicationId, result.environment);

  const client = clientInfo(req);
  const tokens = await createSession(user, { ip: client.ip, userAgent: client.userAgent });
  audit("oauth.login", {
    applicationId: result.applicationId,
    appUserId: user.id,
    ip: client.ip,
    metadata: { provider: "google" },
  });

  const dest = new URL(result.redirectTo);
  dest.hash = new URLSearchParams({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_in: String(tokens.expires_in),
    token_type: tokens.token_type,
  }).toString();
  return NextResponse.redirect(dest.toString());
});
