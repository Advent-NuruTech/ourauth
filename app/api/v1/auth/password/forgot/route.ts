import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { createAndSendReset } from "@/lib/ants/auth/email";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const { app, environment, client } = await publicAppContext(req);
  const body = await parseBody(req, schemas.forgot);
  await enforceRateLimit(`forgot:${app.id}:${client.ip}:${body.email}`, RateLimits.forgot);
  await createAndSendReset(app.id, environment, body.email);
  audit("password.reset_requested", { applicationId: app.id, ip: client.ip });
  // Always succeed (no enumeration).
  return jsonOk({ success: true });
});
