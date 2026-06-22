import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { clientInfo } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { enforceRateLimit, RateLimits } from "@/lib/ants/ratelimit";
import { authenticateDeveloper, issueDeveloperToken } from "@/lib/ants/developers";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handler(async (req: NextRequest) => {
  const client = clientInfo(req);
  const body = await parseBody(req, schemas.developerLogin);
  await enforceRateLimit(`dev_login:${client.ip}:${body.email}`, RateLimits.login);
  const dev = await authenticateDeveloper(body.email, body.password);
  const token = await issueDeveloperToken(dev.id);
  audit("developer.login", { ip: client.ip, metadata: { developer_id: dev.id } });
  return jsonOk({ developer: dev, management_token: token });
});
