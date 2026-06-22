import { sql, type Tx } from "./db";
import { Errors } from "./errors";
import type { Environment } from "./apps";

/**
 * Fully dynamic role & permission system. There are NO built-in roles or
 * permissions — every entry here is created by the tenant's own application and
 * scoped per (application, environment). Test and live each have an independent
 * set of roles, permissions and assignments.
 */

export type Role = {
  id: string;
  application_id: string;
  environment: Environment;
  key: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type Permission = {
  id: string;
  application_id: string;
  environment: Environment;
  key: string;
  description: string | null;
  created_at: string;
};

export type RoleWithPermissions = Role & { permissions: Permission[] };

const KEY_RE = /^[a-z0-9](?:[a-z0-9._:-]*[a-z0-9])?$/i;

/** Validate a machine key (used by both roles and permissions). */
export function assertKey(key: string, label = "key"): string {
  const k = key.trim();
  if (!k || k.length > 100 || !KEY_RE.test(k)) {
    throw Errors.invalidRequest(
      `Invalid ${label}: use letters, numbers and . _ : - (max 100 chars)`,
    );
  }
  return k;
}

// ── Roles ────────────────────────────────────────────────────────────────────

export async function listRoles(
  applicationId: string,
  environment: Environment,
): Promise<RoleWithPermissions[]> {
  const roles = await sql<Role[]>`
    select * from roles
    where application_id = ${applicationId} and environment = ${environment}
    order by created_at asc
  `;
  if (roles.length === 0) return [];
  const perms = await sql<(Permission & { role_id: string })[]>`
    select p.*, rp.role_id from role_permissions rp
    join permissions p on p.id = rp.permission_id
    where rp.role_id in ${sql(roles.map((r) => r.id))}
  `;
  return roles.map((r) => ({
    ...r,
    permissions: perms.filter((p) => p.role_id === r.id),
  }));
}

export async function getRole(
  roleId: string,
  applicationId: string,
  environment: Environment,
): Promise<RoleWithPermissions | null> {
  const rows = await sql<Role[]>`
    select * from roles
    where id = ${roleId} and application_id = ${applicationId} and environment = ${environment}
  `;
  if (!rows[0]) return null;
  const permissions = await sql<Permission[]>`
    select p.* from role_permissions rp
    join permissions p on p.id = rp.permission_id
    where rp.role_id = ${roleId}
    order by p.key asc
  `;
  return { ...rows[0], permissions };
}

export async function createRole(
  applicationId: string,
  environment: Environment,
  input: { key: string; name: string; description?: string | null; is_default?: boolean },
): Promise<Role> {
  const key = assertKey(input.key, "role key");
  const name = input.name?.trim();
  if (!name) throw Errors.invalidRequest("Role name is required");
  try {
    const rows = await sql<Role[]>`
      insert into roles (application_id, environment, key, name, description, is_default)
      values (${applicationId}, ${environment}, ${key}, ${name},
              ${input.description ?? null}, ${input.is_default ?? false})
      returning *
    `;
    return rows[0];
  } catch (e) {
    if (isUniqueViolation(e)) throw Errors.conflict(`A role with key "${key}" already exists`);
    throw e;
  }
}

export async function updateRole(
  roleId: string,
  applicationId: string,
  environment: Environment,
  patch: { name?: string; description?: string | null; is_default?: boolean },
): Promise<Role> {
  const rows = await sql<Role[]>`
    update roles set
      name = coalesce(${patch.name ?? null}, name),
      description = ${patch.description === undefined ? sql`description` : patch.description},
      is_default = coalesce(${patch.is_default ?? null}, is_default),
      updated_at = now()
    where id = ${roleId} and application_id = ${applicationId} and environment = ${environment}
    returning *
  `;
  if (!rows[0]) throw Errors.notFound("Role not found");
  return rows[0];
}

export async function deleteRole(
  roleId: string,
  applicationId: string,
  environment: Environment,
): Promise<void> {
  const rows = await sql`
    delete from roles
    where id = ${roleId} and application_id = ${applicationId} and environment = ${environment}
    returning id
  `;
  if (rows.length === 0) throw Errors.notFound("Role not found");
}

/** Replace the full permission set of a role (permissions must share app+env). */
export async function setRolePermissions(
  roleId: string,
  applicationId: string,
  environment: Environment,
  permissionIds: string[],
): Promise<RoleWithPermissions> {
  await sql.begin(async (tx: Tx) => {
    const role = await tx<{ id: string }[]>`
      select id from roles
      where id = ${roleId} and application_id = ${applicationId} and environment = ${environment}
    `;
    if (!role[0]) throw Errors.notFound("Role not found");

    const ids = Array.from(new Set(permissionIds));
    if (ids.length > 0) {
      const valid = await tx<{ id: string }[]>`
        select id from permissions
        where id in ${tx(ids)} and application_id = ${applicationId} and environment = ${environment}
      `;
      if (valid.length !== ids.length) {
        throw Errors.invalidRequest("One or more permissions do not belong to this environment");
      }
    }
    await tx`delete from role_permissions where role_id = ${roleId}`;
    for (const pid of ids) {
      await tx`insert into role_permissions (role_id, permission_id) values (${roleId}, ${pid})`;
    }
  });
  return (await getRole(roleId, applicationId, environment))!;
}

// ── Permissions ──────────────────────────────────────────────────────────────

export async function listPermissions(
  applicationId: string,
  environment: Environment,
): Promise<Permission[]> {
  return sql<Permission[]>`
    select * from permissions
    where application_id = ${applicationId} and environment = ${environment}
    order by key asc
  `;
}

export async function createPermission(
  applicationId: string,
  environment: Environment,
  input: { key: string; description?: string | null },
): Promise<Permission> {
  const key = assertKey(input.key, "permission key");
  try {
    const rows = await sql<Permission[]>`
      insert into permissions (application_id, environment, key, description)
      values (${applicationId}, ${environment}, ${key}, ${input.description ?? null})
      returning *
    `;
    return rows[0];
  } catch (e) {
    if (isUniqueViolation(e)) throw Errors.conflict(`Permission "${key}" already exists`);
    throw e;
  }
}

export async function deletePermission(
  permissionId: string,
  applicationId: string,
  environment: Environment,
): Promise<void> {
  const rows = await sql`
    delete from permissions
    where id = ${permissionId} and application_id = ${applicationId} and environment = ${environment}
    returning id
  `;
  if (rows.length === 0) throw Errors.notFound("Permission not found");
}

// ── User ⇄ role assignments ──────────────────────────────────────────────────

/** Verify a user exists in the given app+environment; returns its id. */
async function requireUserInEnv(
  userId: string,
  applicationId: string,
  environment: Environment,
): Promise<void> {
  const rows = await sql`
    select id from app_users
    where id = ${userId} and application_id = ${applicationId} and environment = ${environment}
  `;
  if (rows.length === 0) throw Errors.notFound("User not found in this environment");
}

export async function assignRole(
  userId: string,
  roleId: string,
  applicationId: string,
  environment: Environment,
): Promise<void> {
  await requireUserInEnv(userId, applicationId, environment);
  const role = await sql`
    select id from roles
    where id = ${roleId} and application_id = ${applicationId} and environment = ${environment}
  `;
  if (role.length === 0) throw Errors.notFound("Role not found in this environment");
  await sql`
    insert into user_roles (app_user_id, role_id) values (${userId}, ${roleId})
    on conflict do nothing
  `;
}

export async function unassignRole(
  userId: string,
  roleId: string,
  applicationId: string,
  environment: Environment,
): Promise<void> {
  await requireUserInEnv(userId, applicationId, environment);
  await sql`delete from user_roles where app_user_id = ${userId} and role_id = ${roleId}`;
}

/** The user's roles plus the flattened, de-duplicated set of permission keys. */
export async function getUserAccess(
  userId: string,
): Promise<{ roles: Role[]; permissions: string[] }> {
  const roles = await sql<Role[]>`
    select r.* from user_roles ur join roles r on r.id = ur.role_id
    where ur.app_user_id = ${userId}
    order by r.key asc
  `;
  const perms = await sql<{ key: string }[]>`
    select distinct p.key from user_roles ur
    join role_permissions rp on rp.role_id = ur.role_id
    join permissions p on p.id = rp.permission_id
    where ur.app_user_id = ${userId}
    order by p.key asc
  `;
  return { roles, permissions: perms.map((p) => p.key) };
}

/** Auto-assign every role flagged `is_default` to a freshly created user. */
export async function assignDefaultRoles(
  userId: string,
  applicationId: string,
  environment: Environment,
): Promise<void> {
  await sql`
    insert into user_roles (app_user_id, role_id)
    select ${userId}, r.id from roles r
    where r.application_id = ${applicationId} and r.environment = ${environment}
      and r.is_default = true
    on conflict do nothing
  `;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}
