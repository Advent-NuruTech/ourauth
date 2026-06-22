import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { deletePermission } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; permId: string }> };

export const DELETE = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id, permId } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  await deletePermission(permId, id, environment);
  audit("permission.deleted", { applicationId: id, environment, metadata: { permission_id: permId } });
  return jsonOk({ success: true });
});
