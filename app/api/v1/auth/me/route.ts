import { type NextRequest } from "next/server";
import { handler, jsonOk, Errors } from "@/lib/ants/errors";
import { bearer } from "@/lib/ants/request";
import { verifyAccessToken } from "@/lib/ants/jwt";
import { getUserById, publicUser } from "@/lib/ants/auth/users";
import { getUserAccess } from "@/lib/ants/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the authenticated end user together with the dynamic roles and
// permissions assigned to them. Auth via `Authorization: Bearer <access_token>`.
export const GET = handler(async (req: NextRequest) => {
  const token = bearer(req);
  if (!token) throw Errors.unauthorized("Missing access token");
  let claims;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    throw Errors.invalidToken("Invalid or expired access token");
  }
  const user = await getUserById(claims.sub);
  if (!user || user.status !== "active") throw Errors.unauthorized();
  const access = await getUserAccess(user.id);
  return jsonOk({
    user: publicUser(user),
    environment: user.environment,
    roles: access.roles.map((r) => r.key),
    permissions: access.permissions,
  });
});
