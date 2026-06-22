import { type NextRequest } from "next/server";
import { handler, jsonOk, Errors } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { getRole, updateRole, deleteRole } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; roleId: string }> };

export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, roleId } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  const role = await getRole(roleId, id, environment);
  if (!role) throw Errors.notFound("Role not found");
  return jsonOk({ role });
});

export const PATCH = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, roleId } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  const body = await parseBody(req, schemas.updateRole);
  const role = await updateRole(roleId, id, environment, body);
  audit("role.updated", { applicationId: id, environment, metadata: { key: role.key } });
  return jsonOk({ role });
});

export const DELETE = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, roleId } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  await deleteRole(roleId, id, environment);
  audit("role.deleted", { applicationId: id, environment, metadata: { role_id: roleId } });
  return jsonOk({ success: true });
});
