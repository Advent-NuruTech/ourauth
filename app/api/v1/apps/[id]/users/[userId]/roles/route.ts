import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { getUserAccess, assignRole } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; userId: string }> };

// List the roles + flattened permissions assigned to an end user.
export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, userId } = await ctx.params;
  await requireManagement(req, id);
  const access = await getUserAccess(userId);
  return jsonOk({ roles: access.roles, permissions: access.permissions });
});

// Assign a role to a user. Body: { role_id }
export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, userId } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  const body = await parseBody(req, schemas.assignRole);
  await assignRole(userId, body.role_id, id, environment);
  audit("role.assigned", {
    applicationId: id,
    environment,
    appUserId: userId,
    metadata: { role_id: body.role_id },
  });
  return jsonOk({ success: true }, { status: 201 });
});
