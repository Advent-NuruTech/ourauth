import { SignJWT, jwtVerify, createLocalJWKSet } from "jose";
import { sql } from "./db";
import { hashPassword, verifyPassword } from "./crypto/password";
import { getActiveSigningKey, getJwks } from "./crypto/keys";
import { getConfig } from "./config";
import { Errors } from "./errors";

/**
 * Platform managers — operators of the Ants platform itself. This is a separate
 * identity layer from `developers` (tenants): a platform admin oversees ALL
 * tenants and their applications. Tokens use a distinct audience so a developer
 * management token can never be replayed against the platform console, and vice
 * versa.
 */
export type PlatformAdmin = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  created_at: string;
};

const PLATFORM_AUD = "ants:platform";

export async function countPlatformAdmins(): Promise<number> {
  const rows = await sql<{ count: string }[]>`select count(*)::text as count from platform_admins`;
  return Number(rows[0].count);
}

export async function createPlatformAdmin(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<PlatformAdmin> {
  const existing = await sql`select 1 from platform_admins where email = ${input.email}`;
  if (existing.length > 0) throw Errors.conflict("A platform manager with this email already exists");
  const password_hash = await hashPassword(input.password);
  const rows = await sql<PlatformAdmin[]>`
    insert into platform_admins (email, password_hash, name)
    values (${input.email}, ${password_hash}, ${input.name ?? null})
    returning id, email, name, status, created_at
  `;
  return rows[0];
}

export async function authenticatePlatformAdmin(
  email: string,
  password: string,
): Promise<PlatformAdmin> {
  const rows = await sql<(PlatformAdmin & { password_hash: string })[]>`
    select id, email, name, status, created_at, password_hash
    from platform_admins where email = ${email}
  `;
  const row = rows[0];
  // Uniform timing even when the account is unknown.
  const ok = row
    ? await verifyPassword(row.password_hash, password)
    : await verifyPassword("scrypt$32768$8$1$AAAA$AAAA", password);
  if (!row || !ok || row.status !== "active") throw Errors.invalidCredentials();
  await sql`update platform_admins set last_login_at = now() where id = ${row.id}`;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function getPlatformAdminById(id: string): Promise<PlatformAdmin | null> {
  const rows = await sql<PlatformAdmin[]>`
    select id, email, name, status, created_at from platform_admins where id = ${id}
  `;
  return rows[0] ?? null;
}

/** Issue a platform console bearer token (12h), signed with the active Ed25519 key. */
export async function issuePlatformToken(adminId: string): Promise<string> {
  const { kid, privateKey } = await getActiveSigningKey();
  return new SignJWT({})
    .setProtectedHeader({ alg: "EdDSA", kid, typ: "JWT" })
    .setIssuer(getConfig().ISSUER)
    .setSubject(adminId)
    .setAudience(PLATFORM_AUD)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(privateKey);
}

export async function verifyPlatformToken(token: string): Promise<string> {
  try {
    const jwks = createLocalJWKSet(await getJwks());
    const { payload } = await jwtVerify(token, jwks, {
      issuer: getConfig().ISSUER,
      audience: PLATFORM_AUD,
    });
    if (!payload.sub) throw new Error("no sub");
    return payload.sub;
  } catch {
    throw Errors.unauthorized("Invalid platform session");
  }
}

// ── Cross-tenant aggregate views (platform console only) ─────────────────────

export type PlatformStats = {
  developers: number;
  developers_suspended: number;
  applications: number;
  end_users: number;
  active_sessions: number;
  developers_last_7d: number;
  end_users_last_7d: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const rows = await sql<
    {
      developers: string;
      developers_suspended: string;
      applications: string;
      end_users: string;
      active_sessions: string;
      developers_last_7d: string;
      end_users_last_7d: string;
    }[]
  >`
    select
      (select count(*) from developers)::text as developers,
      (select count(*) from developers where status = 'suspended')::text as developers_suspended,
      (select count(*) from applications)::text as applications,
      (select count(*) from app_users)::text as end_users,
      (select count(*) from sessions where revoked_at is null)::text as active_sessions,
      (select count(*) from developers where created_at > now() - interval '7 days')::text as developers_last_7d,
      (select count(*) from app_users where created_at > now() - interval '7 days')::text as end_users_last_7d
  `;
  const r = rows[0];
  return {
    developers: Number(r.developers),
    developers_suspended: Number(r.developers_suspended),
    applications: Number(r.applications),
    end_users: Number(r.end_users),
    active_sessions: Number(r.active_sessions),
    developers_last_7d: Number(r.developers_last_7d),
    end_users_last_7d: Number(r.end_users_last_7d),
  };
}

export type DeveloperRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  created_at: string;
  app_count: number;
  user_count: number;
};

export async function listDevelopersWithStats(opts?: {
  search?: string;
}): Promise<DeveloperRow[]> {
  const like = opts?.search ? `%${opts.search}%` : null;
  const rows = await sql<
    (Omit<DeveloperRow, "app_count" | "user_count"> & {
      app_count: string;
      user_count: string;
    })[]
  >`
    select
      d.id, d.email, d.name, d.status, d.created_at,
      count(distinct a.id)::text as app_count,
      count(distinct u.id)::text as user_count
    from developers d
    left join applications a on a.developer_id = d.id
    left join app_users u on u.application_id = a.id
    ${like ? sql`where d.email ilike ${like}` : sql``}
    group by d.id
    order by d.created_at desc
  `;
  return rows.map((r) => ({
    ...r,
    app_count: Number(r.app_count),
    user_count: Number(r.user_count),
  }));
}

export async function setDeveloperStatus(
  developerId: string,
  status: "active" | "suspended",
): Promise<void> {
  await sql`
    update developers set status = ${status}, updated_at = now() where id = ${developerId}
  `;
}

export type AppRow = {
  id: string;
  name: string;
  environment: string;
  created_at: string;
  developer_id: string;
  developer_email: string;
  user_count: number;
};

export async function listAllApplications(): Promise<AppRow[]> {
  const rows = await sql<(Omit<AppRow, "user_count"> & { user_count: string })[]>`
    select
      a.id, a.name, a.environment, a.created_at,
      a.developer_id, d.email as developer_email,
      count(u.id)::text as user_count
    from applications a
    join developers d on d.id = a.developer_id
    left join app_users u on u.application_id = a.id
    group by a.id, d.email
    order by a.created_at desc
  `;
  return rows.map((r) => ({ ...r, user_count: Number(r.user_count) }));
}

export type AuditRow = {
  id: string;
  event: string;
  ip: string | null;
  application_id: string | null;
  app_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  application_name: string | null;
};

export async function listRecentAudit(limit = 100): Promise<AuditRow[]> {
  return sql<AuditRow[]>`
    select
      l.id::text as id, l.event, l.ip, l.application_id, l.app_user_id,
      l.metadata, l.created_at, a.name as application_name
    from audit_logs l
    left join applications a on a.id = l.application_id
    order by l.created_at desc
    limit ${limit}
  `;
}
