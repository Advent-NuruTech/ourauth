import { SignJWT, jwtVerify, createLocalJWKSet } from "jose";
import { sql } from "./db";
import { hashPassword, verifyPassword } from "./crypto/password";
import { getActiveSigningKey, getJwks } from "./crypto/keys";
import { getConfig } from "./config";
import { Errors } from "./errors";

export type Developer = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  created_at: string;
};

const DEV_AUD = "ants:management";

export async function createDeveloper(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<Developer> {
  const existing = await sql`select 1 from developers where email = ${input.email}`;
  if (existing.length > 0) throw Errors.conflict("An account with this email already exists");
  const password_hash = await hashPassword(input.password);
  const rows = await sql<Developer[]>`
    insert into developers (email, password_hash, name)
    values (${input.email}, ${password_hash}, ${input.name ?? null})
    returning id, email, name, status, created_at
  `;
  return rows[0];
}

/**
 * Resolve a developer from a Google profile, creating or linking as needed.
 * Single source of truth: we key on google_id first, then auto-link to an
 * existing account with the same (Google-verified) email, and only create a new
 * row when neither exists. Google verifies the email, so linking is safe.
 */
export async function upsertDeveloperFromGoogle(input: {
  googleId: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}): Promise<Developer> {
  const email = input.email.toLowerCase();

  const byGoogle = await sql<Developer[]>`
    select id, email, name, status, created_at from developers where google_id = ${input.googleId}
  `;
  if (byGoogle[0]) return byGoogle[0];

  const linked = await sql<Developer[]>`
    update developers
       set google_id      = ${input.googleId},
           avatar_url     = coalesce(avatar_url, ${input.avatarUrl ?? null}),
           name           = coalesce(name, ${input.name ?? null}),
           email_verified = true,
           updated_at     = now()
     where email = ${email} and google_id is null
     returning id, email, name, status, created_at
  `;
  if (linked[0]) return linked[0];

  const created = await sql<Developer[]>`
    insert into developers (email, name, google_id, avatar_url, email_verified)
    values (${email}, ${input.name ?? null}, ${input.googleId}, ${input.avatarUrl ?? null}, true)
    returning id, email, name, status, created_at
  `;
  return created[0];
}

export async function authenticateDeveloper(
  email: string,
  password: string,
): Promise<Developer> {
  const rows = await sql<(Developer & { password_hash: string | null })[]>`
    select id, email, name, status, created_at, password_hash
    from developers where email = ${email}
  `;
  const row = rows[0];
  // Always run a verify to keep timing uniform even when the user is unknown or
  // is a Google-only account (no password_hash) — both fall back to a dummy hash.
  const ok = row?.password_hash
    ? await verifyPassword(row.password_hash, password)
    : await verifyPassword("scrypt$32768$8$1$AAAA$AAAA", password);
  if (!row || !ok || row.status !== "active") throw Errors.invalidCredentials();
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    created_at: row.created_at,
  };
}

/** Issue a management bearer token for a developer (12h). */
export async function issueDeveloperToken(developerId: string): Promise<string> {
  const { kid, privateKey } = await getActiveSigningKey();
  return new SignJWT({})
    .setProtectedHeader({ alg: "EdDSA", kid, typ: "JWT" })
    .setIssuer(getConfig().ISSUER)
    .setSubject(developerId)
    .setAudience(DEV_AUD)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(privateKey);
}

export async function verifyDeveloperToken(token: string): Promise<string> {
  try {
    const jwks = createLocalJWKSet(await getJwks());
    const { payload } = await jwtVerify(token, jwks, {
      issuer: getConfig().ISSUER,
      audience: DEV_AUD,
    });
    if (!payload.sub) throw new Error("no sub");
    return payload.sub;
  } catch {
    throw Errors.unauthorized("Invalid management token");
  }
}
