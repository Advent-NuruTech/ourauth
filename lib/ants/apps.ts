import { sql, jsonb } from "./db";
import { generateToken, hashToken } from "./crypto/tokens";
import { encrypt } from "./crypto/encryption";
import { Errors } from "./errors";

export type Environment = "live" | "test";

export type AppSettings = {
  allowed_origins?: string[];
  redirect_uris?: string[];
  require_email_verification?: boolean;
  access_ttl?: number;
  refresh_ttl?: number;
  google?: { enabled: boolean; client_id?: string; client_secret_enc?: string };
};

export type Application = {
  id: string;
  developer_id: string;
  name: string;
  environment: Environment;
  settings: AppSettings;
  created_at: string;
};

export type ApiKeyType = "pk" | "sk";

/** Create an application owned by a developer. */
export async function createApplication(
  developerId: string,
  input: {
    name: string;
    environment: Environment;
    allowed_origins?: string[];
    redirect_uris?: string[];
  },
): Promise<Application> {
  const settings: AppSettings = {
    allowed_origins: input.allowed_origins ?? [],
    redirect_uris: input.redirect_uris ?? [],
    require_email_verification: true,
  };
  const rows = await sql<Application[]>`
    insert into applications (developer_id, name, environment, settings)
    values (${developerId}, ${input.name}, ${input.environment}, ${jsonb(settings)})
    returning *
  `;
  return rows[0];
}

export async function getApplication(id: string): Promise<Application | null> {
  const rows = await sql<Application[]>`select * from applications where id = ${id}`;
  return rows[0] ?? null;
}

export async function listApplications(developerId: string): Promise<Application[]> {
  return sql<Application[]>`
    select * from applications where developer_id = ${developerId} order by created_at desc
  `;
}

export async function updateApplication(
  id: string,
  patch: Partial<{ name: string }> & { settings?: AppSettings },
): Promise<Application> {
  const rows = await sql<Application[]>`
    update applications set
      name = coalesce(${patch.name ?? null}, name),
      settings = coalesce(${patch.settings ? jsonb(patch.settings) : null}, settings),
      updated_at = now()
    where id = ${id}
    returning *
  `;
  if (!rows[0]) throw Errors.notFound("Application not found");
  return rows[0];
}

export async function deleteApplication(id: string): Promise<void> {
  await sql`delete from applications where id = ${id}`;
}

/** Encrypt and store a per-app Google OAuth secret inside settings. */
export function buildGoogleSettings(
  current: AppSettings,
  google: { enabled: boolean; client_id?: string; client_secret?: string },
): AppSettings {
  return {
    ...current,
    google: {
      enabled: google.enabled,
      client_id: google.client_id ?? current.google?.client_id,
      client_secret_enc: google.client_secret
        ? encrypt(google.client_secret)
        : current.google?.client_secret_enc,
    },
  };
}

// ── API keys ────────────────────────────────────────────────────────────────

export type GeneratedKey = { id: string; key: string; key_prefix: string; type: ApiKeyType };

/** Generate a pk_/sk_ key, store only its hash, and return the plaintext ONCE. */
export async function createApiKey(
  applicationId: string,
  type: ApiKeyType,
  environment: Environment,
): Promise<GeneratedKey> {
  const secret = generateToken(24);
  const key = `${type}_${environment}_${secret}`;
  const key_prefix = key.slice(0, type === "pk" ? key.length : 16); // pk is public anyway
  const rows = await sql<{ id: string }[]>`
    insert into api_keys (application_id, type, key_prefix, key_hash, environment)
    values (${applicationId}, ${type}, ${key_prefix}, ${hashToken(key)}, ${environment})
    returning id
  `;
  return { id: rows[0].id, key, key_prefix, type };
}

export type InitialKeys = {
  test: { publishable_key: string; secret_key: string };
  live: { publishable_key: string; secret_key: string };
};

/**
 * Mint the starter key set for a brand-new application: a publishable + secret
 * key for BOTH the test and live environments. Plaintext is returned once.
 */
export async function createInitialKeys(applicationId: string): Promise<InitialKeys> {
  const [testPk, testSk, livePk, liveSk] = await Promise.all([
    createApiKey(applicationId, "pk", "test"),
    createApiKey(applicationId, "sk", "test"),
    createApiKey(applicationId, "pk", "live"),
    createApiKey(applicationId, "sk", "live"),
  ]);
  return {
    test: { publishable_key: testPk.key, secret_key: testSk.key },
    live: { publishable_key: livePk.key, secret_key: liveSk.key },
  };
}

export type ApiKeyResolution = {
  applicationId: string;
  type: ApiKeyType;
  environment: Environment;
  app: Application;
};

/**
 * Resolve a presented API key to its application. Returns null if unknown or
 * revoked. Updates last_used_at opportunistically.
 */
export async function resolveApiKey(key: string): Promise<ApiKeyResolution | null> {
  const rows = await sql<
    { application_id: string; type: ApiKeyType; environment: Environment }[]
  >`
    update api_keys set last_used_at = now()
    where key_hash = ${hashToken(key)} and revoked_at is null
    returning application_id, type, environment
  `;
  if (rows.length === 0) return null;
  const app = await getApplication(rows[0].application_id);
  if (!app) return null;
  return {
    applicationId: app.id,
    type: rows[0].type,
    environment: rows[0].environment,
    app,
  };
}

/** List key metadata (never the raw key), optionally filtered by environment. */
export async function listApiKeys(applicationId: string, environment?: Environment) {
  return sql`
    select id, type, key_prefix, environment, last_used_at, revoked_at, created_at
    from api_keys
    where application_id = ${applicationId}
      ${environment ? sql`and environment = ${environment}` : sql``}
    order by created_at desc
  `;
}

export async function revokeApiKey(applicationId: string, keyId: string): Promise<void> {
  await sql`
    update api_keys set revoked_at = now()
    where id = ${keyId} and application_id = ${applicationId} and revoked_at is null
  `;
}
