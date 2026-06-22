import { type NextRequest } from "next/server";
import { handler, jsonOk, Errors } from "@/lib/ants/errors";
import { requireManagement, bearer } from "@/lib/ants/request";
import { parseBody, schemas } from "@/lib/ants/validate";
import { createApplication, createInitialKeys, listApplications } from "@/lib/ants/apps";
import { audit } from "@/lib/ants/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// These developer-account operations require a management token, not a secret key.
function requireDeveloperToken(req: NextRequest) {
  if (bearer(req)?.startsWith("sk_")) {
    throw Errors.forbidden("Use your developer management token for this operation");
  }
}

// List the developer's applications.
export const GET = handler(async (req: NextRequest) => {
  requireDeveloperToken(req);
  const { developerId } = await requireManagement(req);
  const apps = await listApplications(developerId!);
  return jsonOk({ applications: apps });
});

// Create an application and return its initial publishable + secret keys (shown once).
export const POST = handler(async (req: NextRequest) => {
  requireDeveloperToken(req);
  const { developerId } = await requireManagement(req);
  const body = await parseBody(req, schemas.createApp);

  const app = await createApplication(developerId!, {
    name: body.name,
    environment: body.environment,
    allowed_origins: body.allowed_origins,
    redirect_uris: body.redirect_uris,
  });
  // Dual-mode: every app starts with both a test and a live key set.
  const keys = await createInitialKeys(app.id);
  audit("app.created", { applicationId: app.id, metadata: { developer_id: developerId } });

  return jsonOk(
    {
      application: app,
      keys,
      note: "Store these secret keys now; they will not be shown again.",
    },
    { status: 201 },
  );
});
