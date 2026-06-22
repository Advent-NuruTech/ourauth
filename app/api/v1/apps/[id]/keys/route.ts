import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement, managementEnvironment } from "@/lib/ants/request";
import { createApiKey, listApiKeys } from "@/lib/ants/apps";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// List key metadata (never the raw key). Use ?environment=live|test to filter.
export const GET = handler(
  async (req: NextRequest, ctx: RouteContext<"/api/v1/apps/[id]/keys">) => {
    const { id } = await ctx.params;
    const { keyEnvironment } = await requireManagement(req, id);
    const hasFilter = new URL(req.url).searchParams.has("environment") || keyEnvironment;
    const env = hasFilter ? managementEnvironment(req, keyEnvironment) : undefined;
    const keys = await listApiKeys(id, env);
    return jsonOk({ keys });
  },
);

// Mint a new key. Body: { "type": "pk" | "sk" }. ?environment=live|test (default test).
export const POST = handler(
  async (req: NextRequest, ctx: RouteContext<"/api/v1/apps/[id]/keys">) => {
    const { id } = await ctx.params;
    const { keyEnvironment } = await requireManagement(req, id);
    const env = managementEnvironment(req, keyEnvironment);
    const body = (await req.json().catch(() => ({}))) as { type?: string };
    const type = body.type === "sk" ? "sk" : "pk";
    const generated = await createApiKey(id, type, env);
    audit("app.key_rotated", { applicationId: id, environment: env, metadata: { type } });
    return jsonOk(
      { id: generated.id, type: generated.type, environment: env, key: generated.key },
      { status: 201 },
    );
  },
);
