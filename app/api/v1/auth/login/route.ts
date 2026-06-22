import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { verifyCredentials, publicUser } from "@/lib/ants/auth/users";
import { createSession } from "@/lib/ants/auth/sessions";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const { app, environment, client } = await publicAppContext(req);
  const body = await parseBody(req, schemas.login);
  await enforceRateLimit(`login:${app.id}:${client.ip}:${body.email}`, RateLimits.login);

  try {
    const user = await verifyCredentials(app.id, environment, body.email, body.password);
    const tokens = await createSession(user, { ip: client.ip, userAgent: client.userAgent });
    audit("user.login", { applicationId: app.id, appUserId: user.id, ip: client.ip });
    return jsonOk({ user: publicUser(user), ...tokens });
  } catch (err) {
    audit("user.login_failed", {
      applicationId: app.id,
      ip: client.ip,
      metadata: { email: body.email },
    });
    throw err;
  }
});
