import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { unassignRole } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; userId: string; roleId: string }> };

// Remove a role from a user.
export const DELETE = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, userId, roleId } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  await unassignRole(userId, roleId, id, environment);
  audit("role.unassigned", {
    applicationId: id,
    environment,
    appUserId: userId,
    metadata: { role_id: roleId },
  });
  return jsonOk({ success: true });
});
