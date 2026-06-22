import { z } from "zod";

/**
 * Centralized, validated configuration. Read lazily so that standalone scripts
 * (which load .env.local manually) and the Next.js runtime both work.
 */
const schema = z.object({
  ANTS_BASE_URL: z
    .string()
    .url()
    .transform((u) => u.replace(/\/$/, "")),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ANTS_MASTER_KEY: z
    .string()
    .min(1, "ANTS_MASTER_KEY is required")
    .refine((v) => Buffer.from(v, "base64").length === 32, {
      message: "ANTS_MASTER_KEY must be 32 bytes, base64 (openssl rand -base64 32)",
    }),
  ADMIN_SIGNUP_CODE: z.string().min(1, "ADMIN_SIGNUP_CODE is required"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  ANTS_ACCESS_TTL: z.coerce.number().int().positive().default(600), // 10 min
  ANTS_REFRESH_TTL: z.coerce.number().int().positive().default(2592000), // 30 days

  RESEND_API_KEY: z.string().optional(),
  ANTS_EMAIL_FROM: z.string().default("Ants <no-reply@ants.local>"),
});

export type AntsConfig = z.infer<typeof schema> & { ISSUER: string };

let cached: AntsConfig | null = null;

export function getConfig(): AntsConfig {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid Ants configuration:\n${issues}`);
  }
  cached = { ...parsed.data, ISSUER: "ants" };
  return cached;
}

export function googleConfigured(): boolean {
  const c = getConfig();
  return Boolean(c.GOOGLE_CLIENT_ID && c.GOOGLE_CLIENT_SECRET);
}
