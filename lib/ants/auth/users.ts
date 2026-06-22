import { sql, jsonb, type Tx } from "../db";
import { hashPassword, verifyPassword } from "../crypto/password";
import { Errors } from "../errors";
import type { Environment } from "../apps";

export type AppUser = {
  id: string;
  application_id: string;
  environment: Environment;
  email: string;
  email_verified: boolean;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
};

const LOCK_THRESHOLD = 8;
const LOCK_MINUTES = 15;

/** Public-safe projection of a user. */
export function publicUser(u: AppUser) {
  return {
    id: u.id,
    email: u.email,
    email_verified: u.email_verified,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
    created_at: u.created_at,
  };
}

export async function findUserByEmail(
  applicationId: string,
  environment: Environment,
  email: string,
): Promise<(AppUser & { password_hash: string | null; locked_until: string | null }) | null> {
  const rows = await sql<
    (AppUser & { password_hash: string | null; locked_until: string | null })[]
  >`
    select * from app_users
    where application_id = ${applicationId} and environment = ${environment} and email = ${email}
  `;
  return rows[0] ?? null;
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await sql<AppUser[]>`select * from app_users where id = ${id}`;
  return rows[0] ?? null;
}

/** Paginated/searchable user listing for the management API (per environment). */
export async function listAppUsers(
  applicationId: string,
  environment: Environment,
  opts: { search?: string; limit: number; offset: number },
): Promise<{ users: AppUser[]; total: number }> {
  const like = opts.search ? `%${opts.search}%` : null;
  const rows = await sql<AppUser[]>`
    select * from app_users
    where application_id = ${applicationId} and environment = ${environment}
      ${like ? sql`and email ilike ${like}` : sql``}
    order by created_at desc
    limit ${opts.limit} offset ${opts.offset}
  `;
  const countRows = await sql<{ count: string }[]>`
    select count(*)::text as count from app_users
    where application_id = ${applicationId} and environment = ${environment}
      ${like ? sql`and email ilike ${like}` : sql``}
  `;
  return { users: rows, total: Number(countRows[0].count) };
}

/** Create an email/password user. Throws conflict if the email already exists. */
export async function createUser(input: {
  applicationId: string;
  environment: Environment;
  email: string;
  password: string;
  fullName?: string;
}): Promise<AppUser> {
  const existing = await findUserByEmail(input.applicationId, input.environment, input.email);
  if (existing) throw Errors.conflict("An account with this email already exists");
  const password_hash = await hashPassword(input.password);
  const rows = await sql<AppUser[]>`
    insert into app_users (application_id, environment, email, password_hash, full_name)
    values (${input.applicationId}, ${input.environment}, ${input.email}, ${password_hash}, ${input.fullName ?? null})
    returning *
  `;
  return rows[0];
}

/**
 * Verify credentials with lockout + uniform timing. Throws invalid_credentials
 * for unknown user / wrong password (no enumeration) and locks the account after
 * repeated failures.
 */
export async function verifyCredentials(
  applicationId: string,
  environment: Environment,
  email: string,
  password: string,
): Promise<AppUser> {
  const user = await findUserByEmail(applicationId, environment, email);

  // Dummy verify keeps response time uniform when the user doesn't exist.
  if (!user || !user.password_hash) {
    await verifyPassword("scrypt$32768$8$1$AAAA$AAAA", password);
    throw Errors.invalidCredentials();
  }
  if (user.status !== "active") throw Errors.forbidden("Account is blocked");
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw Errors.forbidden("Account temporarily locked. Try again later.");
  }

  const ok = await verifyPassword(user.password_hash, password);
  if (!ok) {
    await sql`
      update app_users
      set failed_logins = failed_logins + 1,
          locked_until = case when failed_logins + 1 >= ${LOCK_THRESHOLD}
            then now() + (${LOCK_MINUTES} || ' minutes')::interval else locked_until end
      where id = ${user.id}
    `;
    throw Errors.invalidCredentials();
  }

  await sql`
    update app_users set failed_logins = 0, locked_until = null, last_login_at = now()
    where id = ${user.id}
  `;
  return user;
}

/**
 * Find or create a user from an OAuth identity, linking by provider id or by
 * verified email. Runs in a transaction.
 */
export async function upsertOAuthUser(input: {
  applicationId: string;
  environment: Environment;
  provider: string;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  fullName?: string | null;
  avatarUrl?: string | null;
}): Promise<AppUser> {
  return sql.begin(async (tx: Tx) => {
    const byIdentity = await tx<AppUser[]>`
      select u.* from identities i join app_users u on u.id = i.app_user_id
      where i.application_id = ${input.applicationId}
        and i.environment = ${input.environment}
        and i.provider = ${input.provider}
        and i.provider_user_id = ${input.providerUserId}
    `;
    if (byIdentity[0]) return byIdentity[0];

    let user = (
      await tx<AppUser[]>`
        select * from app_users
        where application_id = ${input.applicationId}
          and environment = ${input.environment} and email = ${input.email}
      `
    )[0];

    if (!user) {
      user = (
        await tx<AppUser[]>`
          insert into app_users
            (application_id, environment, email, email_verified, full_name, avatar_url)
          values (${input.applicationId}, ${input.environment}, ${input.email}, ${input.emailVerified},
                  ${input.fullName ?? null}, ${input.avatarUrl ?? null})
          returning *
        `
      )[0];
    } else if (input.emailVerified && !user.email_verified) {
      await tx`update app_users set email_verified = true where id = ${user.id}`;
      user.email_verified = true;
    }

    await tx`
      insert into identities (app_user_id, application_id, environment, provider, provider_user_id, profile)
      values (${user.id}, ${input.applicationId}, ${input.environment}, ${input.provider}, ${input.providerUserId},
              ${jsonb({ email: input.email, name: input.fullName, picture: input.avatarUrl })})
      on conflict (application_id, environment, provider, provider_user_id) do nothing
    `;
    return user;
  });
}
