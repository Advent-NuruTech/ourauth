import { NextResponse, type NextRequest } from "next/server";
import { clientInfo } from "@/lib/ants/request";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { buildDeveloperGoogleAuthUrl } from "@/lib/ants/oauth/google-developer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Opened in the browser from the dashboard "Continue with Google" button.
// Starts the platform (developer) Google flow and redirects to Google.
export async function GET(req: NextRequest) {
  try {
    const { ip } = clientInfo(req);
    await enforceRateLimit(`dev-oauth:${ip ?? "unknown"}`, RateLimits.oauthStart);
    const url = await buildDeveloperGoogleAuthUrl();
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=oauth_unavailable", req.url));
  }
}
