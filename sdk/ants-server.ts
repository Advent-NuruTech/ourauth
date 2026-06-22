/**
 * Ants server SDK — verify Ants access tokens in YOUR app's backend.
 * Requires `jose`. Verification is offline (JWKS is fetched + cached); no call
 * to Ants is made per request.
 *
 *   import { AntsVerifier } from "@/sdk/ants-server";
 *   const ants = new AntsVerifier({
 *     issuer: "ants",
 *     jwksUrl: "https://ants.adventnurutech.xyz/.well-known/jwks.json",
 *     applicationId: "your-app-id",
 *   });
 *   const claims = await ants.verify(bearerToken); // throws if invalid
 */
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

export type AntsEnvironment = "live" | "test";

export type AntsClaims = JWTPayload & {
  sub: string;
  aud: string;
  sid: string;
  env: AntsEnvironment;
  email: string;
  email_verified: boolean;
};

export type AntsVerifierOptions = {
  jwksUrl: string;
  applicationId: string;
  issuer?: string;
};

export class AntsVerifier {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private issuer: string;
  private applicationId: string;

  constructor(opts: AntsVerifierOptions) {
    this.jwks = createRemoteJWKSet(new URL(opts.jwksUrl));
    this.issuer = opts.issuer ?? "ants";
    this.applicationId = opts.applicationId;
  }

  /** Verify and return claims, or throw if the token is invalid/expired. */
  async verify(token: string): Promise<AntsClaims> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
      audience: this.applicationId,
    });
    return payload as AntsClaims;
  }

  /** Convenience: extract a Bearer token from an Authorization header and verify. */
  async verifyAuthHeader(header: string | null | undefined): Promise<AntsClaims> {
    if (!header?.startsWith("Bearer ")) throw new Error("Missing Bearer token");
    return this.verify(header.slice(7).trim());
  }
}

// ── Management SDK (server-side, uses a secret key) ────────────────────────────

export type AntsRole = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_default: boolean;
  permissions?: AntsPermission[];
};

export type AntsPermission = {
  id: string;
  key: string;
  description: string | null;
};

export type AntsManagementOptions = {
  baseUrl: string;
  /** A secret key `sk_test_…` or `sk_live_…`. Its env is the default for calls. */
  secretKey: string;
  applicationId: string;
  /** Override the environment per client; defaults to the secret key's env. */
  environment?: AntsEnvironment;
};

/**
 * Server-side management client for the fully dynamic RBAC system. Roles and
 * permissions are entirely defined by your application — Ants ships none.
 *
 *   const ants = new AntsManagement({
 *     baseUrl: "https://ants.adventnurutech.xyz",
 *     applicationId: "…",
 *     secretKey: process.env.ANTS_SECRET_KEY!,
 *   });
 *   await ants.createPermission({ key: "invoices:read" });
 *   const role = await ants.createRole({ key: "billing", name: "Billing" });
 *   await ants.assignRole(userId, role.id);
 */
export class AntsManagement {
  private baseUrl: string;
  private sk: string;
  private appId: string;
  private env: AntsEnvironment;

  constructor(opts: AntsManagementOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.sk = opts.secretKey;
    this.appId = opts.applicationId;
    this.env =
      opts.environment ?? (opts.secretKey.startsWith("sk_live_") ? "live" : "test");
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const sep = path.includes("?") ? "&" : "?";
    const url = `${this.baseUrl}/api/v1/apps/${this.appId}${path}${sep}environment=${this.env}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.sk}`,
        ...init.headers,
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = (body as { error?: { message?: string } })?.error ?? {};
      throw new Error(e.message ?? `Ants request failed (${res.status})`);
    }
    return body as T;
  }

  // Roles
  listRoles() {
    return this.request<{ roles: AntsRole[] }>("/roles").then((r) => r.roles);
  }
  createRole(input: {
    key: string;
    name: string;
    description?: string;
    is_default?: boolean;
    permissions?: string[];
  }) {
    return this.request<{ role: AntsRole }>("/roles", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.role);
  }
  updateRole(
    roleId: string,
    patch: { name?: string; description?: string | null; is_default?: boolean },
  ) {
    return this.request<{ role: AntsRole }>(`/roles/${roleId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).then((r) => r.role);
  }
  deleteRole(roleId: string) {
    return this.request<{ success: boolean }>(`/roles/${roleId}`, { method: "DELETE" });
  }
  setRolePermissions(roleId: string, permissionIds: string[]) {
    return this.request<{ role: AntsRole }>(`/roles/${roleId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions: permissionIds }),
    }).then((r) => r.role);
  }

  // Permissions
  listPermissions() {
    return this.request<{ permissions: AntsPermission[] }>("/permissions").then(
      (r) => r.permissions,
    );
  }
  createPermission(input: { key: string; description?: string }) {
    return this.request<{ permission: AntsPermission }>("/permissions", {
      method: "POST",
      body: JSON.stringify(input),
    }).then((r) => r.permission);
  }
  deletePermission(permissionId: string) {
    return this.request<{ success: boolean }>(`/permissions/${permissionId}`, {
      method: "DELETE",
    });
  }

  // User ⇄ role assignments
  getUserAccess(userId: string) {
    return this.request<{ roles: AntsRole[]; permissions: string[] }>(
      `/users/${userId}/roles`,
    );
  }
  assignRole(userId: string, roleId: string) {
    return this.request<{ success: boolean }>(`/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify({ role_id: roleId }),
    });
  }
  unassignRole(userId: string, roleId: string) {
    return this.request<{ success: boolean }>(`/users/${userId}/roles/${roleId}`, {
      method: "DELETE",
    });
  }
}
