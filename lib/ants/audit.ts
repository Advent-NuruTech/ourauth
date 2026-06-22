import { sql, jsonb } from "./db";

export type AuditEvent =
  | "user.signup"
  | "user.login"
  | "user.login_failed"
  | "user.logout"
  | "user.locked"
  | "token.refreshed"
  | "token.reuse_detected"
  | "email.verified"
  | "password.reset_requested"
  | "password.reset"
  | "oauth.login"
  | "developer.signup"
  | "developer.login"
  | "app.created"
  | "app.key_rotated"
  | "role.created"
  | "role.updated"
  | "role.deleted"
  | "role.assigned"
  | "role.unassigned"
  | "permission.created"
  | "permission.deleted";

export type AuditContext = {
  applicationId?: string | null;
  appUserId?: string | null;
  environment?: "live" | "test" | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

/** Fire-and-forget audit write (never blocks or throws into the request path). */
export function audit(event: AuditEvent, ctx: AuditContext = {}): void {
  sql`
    insert into audit_logs (application_id, app_user_id, environment, event, ip, user_agent, metadata)
    values (${ctx.applicationId ?? null}, ${ctx.appUserId ?? null}, ${ctx.environment ?? null}, ${event},
            ${ctx.ip ?? null}, ${ctx.userAgent ?? null}, ${jsonb(ctx.metadata ?? {})})
  `.catch((e) => console.error("[ants] audit write failed:", e));
}
