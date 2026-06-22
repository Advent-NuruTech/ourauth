import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { listRoles, createRole, setRolePermissions } from "@/lib/ants/rbac";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List the application's roles (with their permissions) for an environment.
export const GET = handler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const { keyEnvironment } = await requireManagement(req, id);
    const environment = managementEnvironment(req, keyEnvironment);
    const roles = await listRoles(id, environment);
    return jsonOk({ roles, environment });
  },
);

// Create a role. Body: { key, name, description?, is_default?, permissions?: id[] }
export const POST = handler(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params;
    const { keyEnvironment } = await requireManagement(req, id);
    const environment = managementEnvironment(req, keyEnvironment);
    const body = await parseBody(req, schemas.createRole);
    const role = await createRole(id, environment, {
      key: body.key,
      name: body.name,
      description: body.description,
      is_default: body.is_default,
    });
    if (body.permissions?.length) {
      await setRolePermissions(role.id, id, environment, body.permissions);
    }
    audit("role.created", { applicationId: id, environment, metadata: { key: role.key } });
    return jsonOk({ role }, { status: 201 });
  },
);
