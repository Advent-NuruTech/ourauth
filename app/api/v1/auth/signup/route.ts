import { type NextRequest } from "next/server";
import { handler, jsonOk, Errors } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { validatePasswordStrength, isPasswordBreached } from "@/lib/ants/crypto/password";
import { createUser, publicUser } from "@/lib/ants/auth/users";
import { createSession } from "@/lib/ants/auth/sessions";
import { createAndSendVerification } from "@/lib/ants/auth/email";
import { assignDefaultRoles } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const { app, environment, client } = await publicAppContext(req);
  await enforceRateLimit(`signup:${app.id}:${client.ip}`, RateLimits.signup);

  const body = await parseBody(req, schemas.signup);
  const weak = validatePasswordStrength(body.password);
  if (weak) throw Errors.invalidRequest(weak);
  if (await isPasswordBreached(body.password)) {
    throw Errors.invalidRequest("This password has appeared in a data breach. Choose another.");
  }

  const user = await createUser({
    applicationId: app.id,
    environment,
    email: body.email,
    password: body.password,
    fullName: body.full_name,
  });
  await assignDefaultRoles(user.id, app.id, environment);

  if (app.settings.require_email_verification !== false) {
    await createAndSendVerification(user);
  }
  audit("user.signup", { applicationId: app.id, appUserId: user.id, ip: client.ip });

  const tokens = await createSession(user, { ip: client.ip, userAgent: client.userAgent });
  return jsonOk(
    {
      user: publicUser(user),
      email_verification_required: app.settings.require_email_verification !== false,
      ...tokens,
    },
    { status: 201 },
  );
});
