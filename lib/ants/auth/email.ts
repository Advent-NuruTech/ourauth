import { sql } from "../db";
import { generateToken, hashToken } from "../crypto/tokens";
import { hashPassword } from "../crypto/password";
import { getConfig } from "../config";
import { Errors } from "../errors";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TTL_MS = 60 * 60 * 1000; // 1h

type Email = { to: string; subject: string; text: string };

/** Send an email via Resend if configured, otherwise log to the console (dev). */
async function send(email: Email): Promise<void> {
  const cfg = getConfig();
  if (!cfg.RESEND_API_KEY) {
    console.log(`\n[ants:email] To: ${email.to}\nSubject: ${email.subject}\n${email.text}\n`);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: cfg.ANTS_EMAIL_FROM,
        to: email.to,
        subject: email.subject,
        text: email.text,
      }),
    });
  } catch (e) {
    console.error("[ants] email send failed:", e);
  }
}

// ── Email verification ───────────────────────────────────────────────────────

export async function createAndSendVerification(user: {
  id: string;
  email: string;
}): Promise<void> {
  const token = generateToken();
  const expires = new Date(Date.now() + VERIFY_TTL_MS);
  await sql`
    insert into email_verification_tokens (app_user_id, token_hash, expires_at)
    values (${user.id}, ${hashToken(token)}, ${expires})
  `;
  const link = `${getConfig().ANTS_BASE_URL}/api/v1/auth/verify-email?token=${token}`;
  await send({
    to: user.email,
    subject: "Verify your email",
    text: `Confirm your email by visiting:\n${link}\n\nThis link expires in 24 hours.`,
  });
}

export async function consumeVerification(token: string): Promise<void> {
  const rows = await sql<{ id: string; app_user_id: string; expires_at: string; used_at: string | null }[]>`
    select id, app_user_id, expires_at, used_at
    from email_verification_tokens where token_hash = ${hashToken(token)}
  `;
  const row = rows[0];
  if (!row || row.used_at || new Date(row.expires_at) <= new Date()) {
    throw Errors.invalidToken("Verification link is invalid or expired");
  }
  await sql.begin(async (tx) => {
    await tx`update email_verification_tokens set used_at = now() where id = ${row.id}`;
    await tx`update app_users set email_verified = true where id = ${row.app_user_id}`;
  });
}

// ── Password reset ─────────────────────────────────────────────────────────-

/**
 * Always behaves identically whether or not the email exists (no enumeration).
 */
export async function createAndSendReset(
  applicationId: string,
  environment: "live" | "test",
  email: string,
): Promise<void> {
  const rows = await sql<{ id: string }[]>`
    select id from app_users
    where application_id = ${applicationId} and environment = ${environment} and email = ${email}
  `;
  if (rows[0]) {
    const token = generateToken();
    const expires = new Date(Date.now() + RESET_TTL_MS);
    await sql`
      insert into password_reset_tokens (app_user_id, token_hash, expires_at)
      values (${rows[0].id}, ${hashToken(token)}, ${expires})
    `;
    const link = `${getConfig().ANTS_BASE_URL}/reset-password?token=${token}`;
    await send({
      to: email,
      subject: "Reset your password",
      text: `Reset your password here:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.`,
    });
  }
}

export async function consumeReset(token: string, newPassword: string): Promise<void> {
  const rows = await sql<{ id: string; app_user_id: string; expires_at: string; used_at: string | null }[]>`
    select id, app_user_id, expires_at, used_at
    from password_reset_tokens where token_hash = ${hashToken(token)}
  `;
  const row = rows[0];
  if (!row || row.used_at || new Date(row.expires_at) <= new Date()) {
    throw Errors.invalidToken("Reset link is invalid or expired");
  }
  const password_hash = await hashPassword(newPassword);
  await sql.begin(async (tx) => {
    await tx`update password_reset_tokens set used_at = now() where id = ${row.id}`;
    await tx`
      update app_users set password_hash = ${password_hash}, failed_logins = 0, locked_until = null
      where id = ${row.app_user_id}
    `;
    // Invalidate all existing sessions on password reset.
    await tx`update sessions set revoked_at = now() where app_user_id = ${row.app_user_id} and revoked_at is null`;
  });
}
