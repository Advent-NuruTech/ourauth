import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { setRolePermissions } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; roleId: string }> };

// Replace the full permission set of a role. Body: { permissions: permissionId[] }
export const PUT = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, roleId } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  const body = await parseBody(req, schemas.setRolePermissions);
  const role = await setRolePermissions(roleId, id, environment, body.permissions);
  audit("role.updated", { applicationId: id, environment, metadata: { key: role.key, permissions: role.permissions.length } });
  return jsonOk({ role });
});
