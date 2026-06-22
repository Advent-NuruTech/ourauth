import { type NextRequest } from "next/server";
import { handler, jsonOk } from "@/lib/ants/errors";
import { requireManagement } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import {
  updateApplication,
  deleteApplication,
  buildGoogleSettings,
  type AppSettings,
} from "@/lib/ants/apps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handler(
  async (req: NextRequest, ctx: RouteContext<"/api/v1/apps/[id]">) => {
    const { id } = await ctx.params;
    const { application } = await requireManagement(req, id);
    return jsonOk({ application });
  },
);

export const PATCH = handler(
  async (req: NextRequest, ctx: RouteContext<"/api/v1/apps/[id]">) => {
    const { id } = await ctx.params;
    const { application } = await requireManagement(req, id);
    const body = await parseBody(req, schemas.updateApp);

    let settings: AppSettings = { ...application!.settings };
    if (body.allowed_origins !== undefined) settings.allowed_origins = body.allowed_origins;
    if (body.redirect_uris !== undefined) settings.redirect_uris = body.redirect_uris;
    if (body.require_email_verification !== undefined) {
      settings.require_email_verification = body.require_email_verification;
    }
    if (body.google) settings = buildGoogleSettings(settings, body.google);

    const updated = await updateApplication(id, { name: body.name, settings });
    return jsonOk({ application: updated });
  },
);

export const DELETE = handler(
  async (req: NextRequest, ctx: RouteContext<"/api/v1/apps/[id]">) => {
    const { id } = await ctx.params;
    await requireManagement(req, id);
    await deleteApplication(id);
    return jsonOk({ success: true });
  },
);
