import { type NextRequest } from "next/server";
import { handler, jsonOk, Errors } from "@/lib/ants/errors";
import { clientInfo } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { validatePasswordStrength, isPasswordBreached } from "@/lib/ants/crypto/password";
import { safeEqual } from "@/lib/ants/crypto/tokens";
import { getConfig } from "@/lib/ants/config";
import { createDeveloper, issueDeveloperToken } from "@/lib/ants/developers";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Developer (tenant) signup, gated by ADMIN_SIGNUP_CODE.
export const POST = handler(async (req: NextRequest) => {
  const client = clientInfo(req);
  await enforceRateLimit(`dev_signup:${client.ip}`, RateLimits.signup);
  const body = await parseBody(req, schemas.developerSignup);

  if (!safeEqual(body.code, getConfig().ADMIN_SIGNUP_CODE)) {
    throw Errors.forbidden("Invalid signup code");
  }
  const weak = validatePasswordStrength(body.password);
  if (weak) throw Errors.invalidRequest(weak);
  if (await isPasswordBreached(body.password)) {
    throw Errors.invalidRequest("This password has appeared in a data breach. Choose another.");
  }

  const dev = await createDeveloper({ email: body.email, password: body.password, name: body.name });
  const token = await issueDeveloperToken(dev.id);
  audit("developer.signup", { ip: client.ip, metadata: { developer_id: dev.id } });
  return jsonOk({ developer: dev, management_token: token }, { status: 201 });
});
