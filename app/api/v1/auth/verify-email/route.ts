import { type NextRequest } from "next/server";
import { handler, jsonOk, Errors } from "@/lib/ants/errors";
import { parseBody, schemas } from "@/lib/ants/validate";
import { consumeVerification } from "@/lib/ants/auth/email";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET is used by the link emailed to the user (?token=...).
export const GET = handler(async (req: NextRequest) => {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) throw Errors.invalidRequest("Missing token");
  await consumeVerification(token);
  audit("email.verified", {});
  return jsonOk({ success: true, message: "Email verified. You can close this window." });
});

// POST lets SDK / SPA submit the token programmatically.
export const POST = handler(async (req: NextRequest) => {
  const body = await parseBody(req, schemas.verifyEmail);
  await consumeVerification(body.token);
  audit("email.verified", {});
  return jsonOk({ success: true });
});
