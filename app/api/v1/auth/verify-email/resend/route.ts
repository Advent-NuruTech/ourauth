import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { findUserByEmail } from "@/lib/ants/auth/users";
import { createAndSendVerification } from "@/lib/ants/auth/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const { app, environment, client } = await publicAppContext(req);
  const body = await parseBody(req, schemas.resend);
  await enforceRateLimit(`resend:${app.id}:${client.ip}:${body.email}`, RateLimits.forgot);

  // No enumeration: respond identically whether or not the user exists/needs it.
  const user = await findUserByEmail(app.id, environment, body.email);
  if (user && !user.email_verified) {
    await createAndSendVerification(user);
  }
  return jsonOk({ success: true });
});
