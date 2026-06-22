import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { listAppUsers, publicUser } from "@/lib/ants/auth/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List end users of an application's pool. Query: ?environment=&search=&limit=&offset=
export const GET = handler(
  async (req: NextRequest, ctx: RouteContext<"/api/v1/apps/[id]/users">) => {
    const { id } = await ctx.params;
    const { keyEnvironment } = await requireManagement(req, id);
    const environment = managementEnvironment(req, keyEnvironment);
    const params = new URL(req.url).searchParams;
    const limit = Math.min(Number(params.get("limit")) || 50, 200);
    const offset = Math.max(Number(params.get("offset")) || 0, 0);
    const search = params.get("search") || undefined;
    const { users, total } = await listAppUsers(id, environment, { search, limit, offset });
    return jsonOk({ users: users.map(publicUser), total, limit, offset, environment });
  },
);
