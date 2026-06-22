import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { rotateRefreshToken } from "@/lib/ants/auth/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const { app, client } = await publicAppContext(req);
  await enforceRateLimit(`refresh:${app.id}:${client.ip}`, RateLimits.refresh);
  const body = await parseBody(req, schemas.refresh);
  const tokens = await rotateRefreshToken(body.refresh_token, app.id);
  return jsonOk(tokens);
});
