import { type NextRequest } from "next/server";
import { handler, jsonOk, Errors } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { validatePasswordStrength, isPasswordBreached } from "@/lib/ants/crypto/password";
import { consumeReset } from "@/lib/ants/auth/email";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const { app, client } = await publicAppContext(req);
  const body = await parseBody(req, schemas.reset);
  const weak = validatePasswordStrength(body.password);
  if (weak) throw Errors.invalidRequest(weak);
  if (await isPasswordBreached(body.password)) {
    throw Errors.invalidRequest("This password has appeared in a data breach. Choose another.");
  }
  await consumeReset(body.token, body.password);
  audit("password.reset", { applicationId: app.id, ip: client.ip });
  return jsonOk({ success: true });
});
