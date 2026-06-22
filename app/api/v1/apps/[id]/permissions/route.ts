import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { listPermissions, createPermission } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// List the application's permissions for an environment.
export const GET = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  const permissions = await listPermissions(id, environment);
  return jsonOk({ permissions, environment });
});

// Create a permission. Body: { key, description? }
export const POST = handler(async (req: NextRequest, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { keyEnvironment } = await requireManagement(req, id);
  const environment = managementEnvironment(req, keyEnvironment);
  const body = await parseBody(req, schemas.createPermission);
  const permission = await createPermission(id, environment, body);
  audit("permission.created", { applicationId: id, environment, metadata: { key: permission.key } });
  return jsonOk({ permission }, { status: 201 });
});
