import { NextResponse, type NextRequest } from "next/server";
import { clientInfo } from "@/lib/ants/request";
import { handleDeveloperGoogleCallback } from "@/lib/ants/oauth/google-developer";
import { upsertDeveloperFromGoogle, issueDeveloperToken } from "@/lib/ants/developers";
import { setDeveloperSession } from "@/lib/ants/dashboard/session";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Google redirects here after consent. We exchange the code, upsert (or link) the
// developer by verified email, mint a management token, set the session cookie,
// and land them in the dashboard — same destination as email/password sign-in.
export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  if (params.get("error")) {
    return NextResponse.redirect(new URL("/sign-in?error=google_denied", req.url));
  }
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    return NextResponse.redirect(new URL("/sign-in?error=google_failed", req.url));
  }

  try {
    const profile = await handleDeveloperGoogleCallback(state, code);
    const dev = await upsertDeveloperFromGoogle({
      googleId: profile.providerUserId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });
    const token = await issueDeveloperToken(dev.id);
    await setDeveloperSession(token);
    const { ip } = clientInfo(req);
    audit("developer.login", { ip, metadata: { developer_id: dev.id, via: "google" } });
    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=google_failed", req.url));
  }
}
