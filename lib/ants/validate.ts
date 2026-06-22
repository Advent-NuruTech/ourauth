import { z } from "zod";
import { AntsError } from "./errors";

const email = z.string().email().max(320).transform((e) => e.toLowerCase().trim());
const password = z.string().min(1).max(256);

export const schemas = {
  signup: z.object({
    email,
    password,
    full_name: z.string().max(200).optional(),
  }),
  login: z.object({ email, password }),
  refresh: z.object({ refresh_token: z.string().min(1) }),
  logout: z.object({ refresh_token: z.string().min(1).optional() }),
  verifyEmail: z.object({ token: z.string().min(1) }),
  resend: z.object({ email }),
  forgot: z.object({ email }),
  reset: z.object({ token: z.string().min(1), password }),

  developerSignup: z.object({
    email,
    password,
    name: z.string().max(200).optional(),
    code: z.string().min(1),
  }),
  developerLogin: z.object({ email, password }),

  createApp: z.object({
    name: z.string().min(1).max(120),
    environment: z.enum(["live", "test"]).default("test"),
    allowed_origins: z.array(z.string().url()).max(50).optional(),
    redirect_uris: z.array(z.string().url()).max(50).optional(),
  }),
  updateApp: z.object({
    name: z.string().min(1).max(120).optional(),
    allowed_origins: z.array(z.string().url()).max(50).optional(),
    redirect_uris: z.array(z.string().url()).max(50).optional(),
    require_email_verification: z.boolean().optional(),
    google: z
      .object({
        enabled: z.boolean(),
        client_id: z.string().optional(),
        client_secret: z.string().optional(),
      })
      .optional(),
  }),

  // ── Dynamic RBAC (all keys/names are application-defined) ──────────────────
  createRole: z.object({
    key: z.string().min(1).max(100),
    name: z.string().min(1).max(120),
    description: z.string().max(500).optional(),
    is_default: z.boolean().optional(),
    permissions: z.array(z.string().uuid()).max(200).optional(),
  }),
  updateRole: z.object({
    name: z.string().min(1).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
    is_default: z.boolean().optional(),
  }),
  setRolePermissions: z.object({
    permissions: z.array(z.string().uuid()).max(200),
  }),
  createPermission: z.object({
    key: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
  }),
  assignRole: z.object({
    role_id: z.string().uuid(),
  }),
};

/** Parse JSON body against a schema, throwing a clean 400 on failure. */
export async function parseBody<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AntsError(400, "invalid_request", "Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new AntsError(400, "invalid_request", "Validation failed", {
      fields: result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
  }
  return result.data;
}
