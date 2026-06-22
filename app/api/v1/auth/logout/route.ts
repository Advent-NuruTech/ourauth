import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { publicAppContext } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { revokeByRefreshToken } from "@/lib/ants/auth/sessions";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const { app, client } = await publicAppContext(req);
  const body = await parseBody(req, schemas.logout);
  if (body.refresh_token) {
    await revokeByRefreshToken(body.refresh_token);
    audit("user.logout", { applicationId: app.id, ip: client.ip });
  }
  return jsonOk({ success: true });
});
