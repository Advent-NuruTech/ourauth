import { sql, type Tx } from "../db";
import { generateToken, hashToken } from "../crypto/tokens";
import { issueAccessToken } from "../jwt";
import { getConfig } from "../config";
import { audit } from "../audit";
import { Errors } from "../errors";
import type { AppUser } from "./users";

export type TokenBundle = {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
};

function refreshTtl(): number {
  return getConfig().ANTS_REFRESH_TTL;
}

async function mintAccess(user: AppUser, sessionId: string): Promise<string> {
  return issueAccessToken({
    sub: user.id,
    aud: user.application_id,
    sid: sessionId,
    env: user.environment,
    email: user.email,
    email_verified: user.email_verified,
  });
}

async function insertRefresh(
  tx: Tx,
  sessionId: string,
  familyId: string,
  parentId: string | null,
): Promise<string> {
  const token = generateToken(32);
  const expires = new Date(Date.now() + refreshTtl() * 1000);
  await tx`
    insert into refresh_tokens (session_id, family_id, parent_id, token_hash, expires_at)
    values (${sessionId}, ${familyId}, ${parentId}, ${hashToken(token)}, ${expires})
  `;
  return token;
}

/** Create a new session + initial refresh token, and return the token bundle. */
export async function createSession(
  user: AppUser,
  ctx: { ip?: string | null; userAgent?: string | null },
): Promise<TokenBundle> {
  const { sessionId, refresh } = await sql.begin(async (tx: Tx) => {
    const s = await tx<{ id: string }[]>`
      insert into sessions (app_user_id, ip, user_agent)
      values (${user.id}, ${ctx.ip ?? null}, ${ctx.userAgent ?? null})
      returning id
    `;
    const sessionId = s[0].id;
    const familyId = crypto.randomUUID();
    const refresh = await insertRefresh(tx, sessionId, familyId, null);
    return { sessionId, refresh };
  });

  const access = await mintAccess(user, sessionId);
  return {
    access_token: access,
    refresh_token: refresh,
    token_type: "Bearer",
    expires_in: getConfig().ANTS_ACCESS_TTL,
  };
}

type RefreshRow = {
  id: string;
  session_id: string;
  family_id: string;
  used_at: string | null;
  revoked_at: string | null;
  expires_at: string;
  app_user_id: string;
  application_id: string;
  session_revoked_at: string | null;
};

/**
 * Rotate a refresh token. Implements reuse detection: presenting a token that
 * was already consumed or revoked revokes the ENTIRE family (assumed theft).
 */
export async function rotateRefreshToken(
  presented: string,
  appId: string,
): Promise<TokenBundle> {
  // The transaction returns a DECISION. Reuse-revocation and errors are handled
  // AFTER commit — throwing inside the tx would roll back the revocation.
  type Decision =
    | { kind: "ok"; refresh: string; sessionId: string; user: AppUser }
    | { kind: "reuse"; familyId: string; userId: string }
    | { kind: "invalid" };

  const decision: Decision = await sql.begin(async (tx: Tx): Promise<Decision> => {
    const rows = await tx<RefreshRow[]>`
      select rt.id, rt.session_id, rt.family_id, rt.used_at, rt.revoked_at, rt.expires_at,
             s.app_user_id, u.application_id, s.revoked_at as session_revoked_at
      from refresh_tokens rt
      join sessions s on s.id = rt.session_id
      join app_users u on u.id = s.app_user_id
      where rt.token_hash = ${hashToken(presented)}
      for update of rt
    `;
    const row = rows[0];
    if (!row || row.application_id !== appId) return { kind: "invalid" };

    // Reuse detection: a consumed/revoked token (or a revoked session) → theft.
    if (row.used_at || row.revoked_at || row.session_revoked_at) {
      return { kind: "reuse", familyId: row.family_id, userId: row.app_user_id };
    }
    if (new Date(row.expires_at) <= new Date()) return { kind: "invalid" };

    // Consume current, issue successor in the same family.
    await tx`update refresh_tokens set used_at = now() where id = ${row.id}`;
    await tx`update sessions set last_seen_at = now() where id = ${row.session_id}`;
    const next = await insertRefresh(tx, row.session_id, row.family_id, row.id);
    const userRows = await tx<AppUser[]>`select * from app_users where id = ${row.app_user_id}`;
    return { kind: "ok", refresh: next, sessionId: row.session_id, user: userRows[0] };
  });

  if (decision.kind === "invalid") throw Errors.invalidToken();
  if (decision.kind === "reuse") {
    // Committed in its own statement so the revocation actually persists.
    await sql`
      update refresh_tokens set revoked_at = now()
      where family_id = ${decision.familyId} and revoked_at is null
    `;
    audit("token.reuse_detected", {
      applicationId: appId,
      appUserId: decision.userId,
      metadata: { family_id: decision.familyId },
    });
    throw Errors.invalidToken("Refresh token reuse detected; session revoked");
  }

  const access = await mintAccess(decision.user, decision.sessionId);
  audit("token.refreshed", { applicationId: appId, appUserId: decision.user.id });
  return {
    access_token: access,
    refresh_token: decision.refresh,
    token_type: "Bearer",
    expires_in: getConfig().ANTS_ACCESS_TTL,
  };
}

/** Revoke the session associated with a refresh token (logout). */
export async function revokeByRefreshToken(presented: string): Promise<void> {
  await sql`
    update sessions set revoked_at = now()
    where id = (select session_id from refresh_tokens where token_hash = ${hashToken(presented)})
  `;
  await sql`
    update refresh_tokens set revoked_at = now()
    where session_id = (select session_id from refresh_tokens where token_hash = ${hashToken(presented)})
      and revoked_at is null
  `;
}
