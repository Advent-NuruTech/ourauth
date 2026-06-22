import { NextResponse, type NextRequest } from "next/server";
import { handler, Errors } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { buildGoogleAuthUrl } from "@/lib/ants/oauth/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Opened in the browser. Requires ?key=pk_... and ?redirect_to=<allow-listed url>.
export const GET = handler(async (req: NextRequest) => {
  const { app, environment, client } = await publicAppContext(req);
  await enforceRateLimit(`oauth:${app.id}:${client.ip}`, RateLimits.oauthStart);
  const redirectTo = new URL(req.url).searchParams.get("redirect_to");
  if (!redirectTo) throw Errors.invalidRequest("Missing redirect_to");
  const url = await buildGoogleAuthUrl(app, environment, redirectTo);
  return NextResponse.redirect(url);
});
