import { type NextRequest } from "next/server";
import { Errors } from "./errors";
import {
  resolveApiKey,
  getApplication,
  type Application,
  type ApiKeyResolution,
  type Environment,
} from "./apps";
import { verifyDeveloperToken } from "./developers";

/** Parse an `environment` query/body value, defaulting to the given fallback. */
export function parseEnvironment(
  value: string | null | undefined,
  fallback: Environment = "test",
): Environment {
  return value === "live" || value === "test" ? value : fallback;
}

export type ClientInfo = { ip: string | null; userAgent: string | null; origin: string | null };

export function clientInfo(req: NextRequest): ClientInfo {
  const xff = req.headers.get("x-forwarded-for");
  const ip = xff ? xff.split(",")[0].trim() : req.headers.get("x-real-ip");
  return {
    ip: ip || null,
    userAgent: req.headers.get("user-agent"),
    origin: req.headers.get("origin"),
  };
}

/**
 * Resolve the application context for an END-USER auth request. Requires a
 * publishable key in `X-Ants-Key` (or `?key=`), and enforces the per-app origin
 * allowlist when an Origin header is present.
 */
export async function publicAppContext(
  req: NextRequest,
): Promise<{
  app: Application;
  environment: Environment;
  resolution: ApiKeyResolution;
  client: ClientInfo;
}> {
  const key =
    req.headers.get("x-ants-key") ?? new URL(req.url).searchParams.get("key") ?? "";
  if (!key.startsWith("pk_")) {
    throw Errors.unauthorized("Missing or invalid publishable key (X-Ants-Key)");
  }
  const resolution = await resolveApiKey(key);
  if (!resolution || resolution.type !== "pk") {
    throw Errors.unauthorized("Invalid publishable key");
  }
  const client = clientInfo(req);
  const allowed = resolution.app.settings.allowed_origins ?? [];
  if (client.origin && allowed.length > 0 && !allowed.includes(client.origin)) {
    throw Errors.forbidden("Origin not allowed for this application");
  }
  return { app: resolution.app, environment: resolution.environment, resolution, client };
}

/** Extract a Bearer token from the Authorization header. */
export function bearer(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

/**
 * Authorize a MANAGEMENT request and resolve which application is being acted on.
 * Accepts either a developer management JWT (full access to their apps) or a
 * secret key `sk_...` (scoped to that key's application).
 *
 * When `appId` is provided, verifies the caller may act on it.
 */
export async function requireManagement(
  req: NextRequest,
  appId?: string,
): Promise<{ developerId?: string; application?: Application; keyEnvironment?: Environment }> {
  const token = bearer(req);
  if (!token) throw Errors.unauthorized("Provide a management token or secret key");

  if (token.startsWith("sk_")) {
    const resolution = await resolveApiKey(token);
    if (!resolution || resolution.type !== "sk") throw Errors.unauthorized("Invalid secret key");
    if (appId && appId !== resolution.applicationId) {
      throw Errors.forbidden("Secret key does not grant access to this application");
    }
    return {
      application: resolution.app,
      developerId: resolution.app.developer_id,
      keyEnvironment: resolution.environment,
    };
  }

  // Developer management JWT
  const developerId = await verifyDeveloperToken(token);
  if (appId) {
    const app = await getApplication(appId);
    if (!app) throw Errors.notFound("Application not found");
    if (app.developer_id !== developerId) throw Errors.forbidden("Not your application");
    return { developerId, application: app };
  }
  return { developerId };
}

/**
 * Resolve the target environment for a MANAGEMENT request. An explicit
 * `?environment=` query param wins; otherwise a secret key implies its own
 * environment; otherwise we default to `test` (the safe default).
 */
export function managementEnvironment(
  req: NextRequest,
  keyEnvironment?: Environment,
): Environment {
  const q = new URL(req.url).searchParams.get("environment");
  return parseEnvironment(q, keyEnvironment ?? "test");
}
