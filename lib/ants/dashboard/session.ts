import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyDeveloperToken, type Developer } from "../developers";
import { verifyPlatformToken, getPlatformAdminById, type PlatformAdmin } from "../platform";
import { sql } from "../db";

/**
 * Server-only session helpers for the two dashboards. The signed JWT (a
 * developer management token or a platform-console token) is stored in an
 * httpOnly cookie so it is never exposed to client JavaScript. The two consoles
 * use separate cookies and separate token audiences, keeping tenants and
 * platform managers fully isolated.
 */
const DEV_COOKIE = "ants_dev_session";
const PLATFORM_COOKIE = "ants_platform_session";
const MAX_AGE = 12 * 60 * 60; // 12h, matches token lifetime

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

// ── Developer (tenant) session ───────────────────────────────────────────────

export async function setDeveloperSession(token: string): Promise<void> {
  (await cookies()).set(DEV_COOKIE, token, cookieOptions());
}

export async function clearDeveloperSession(): Promise<void> {
  (await cookies()).delete(DEV_COOKIE);
}

/** Resolve the signed-in developer, or redirect to sign-in. */
export async function requireDeveloper(): Promise<Developer> {
  const token = (await cookies()).get(DEV_COOKIE)?.value;
  if (!token) redirect("/sign-in");
  let developerId: string;
  try {
    developerId = await verifyDeveloperToken(token);
  } catch {
    redirect("/sign-in");
  }
  const rows = await sql<Developer[]>`
    select id, email, name, status, created_at from developers where id = ${developerId}
  `;
  const dev = rows[0];
  if (!dev || dev.status !== "active") {
    await clearDeveloperSession();
    redirect("/sign-in?suspended=1");
  }
  return dev;
}

/** Return the raw developer management token (for calling lib that expects it). */
export async function getDeveloperToken(): Promise<string | null> {
  return (await cookies()).get(DEV_COOKIE)?.value ?? null;
}

// ── Platform manager session ─────────────────────────────────────────────────

export async function setPlatformSession(token: string): Promise<void> {
  (await cookies()).set(PLATFORM_COOKIE, token, cookieOptions());
}

export async function clearPlatformSession(): Promise<void> {
  (await cookies()).delete(PLATFORM_COOKIE);
}

/** Resolve the signed-in platform manager, or redirect to the platform login. */
export async function requirePlatformAdmin(): Promise<PlatformAdmin> {
  const token = (await cookies()).get(PLATFORM_COOKIE)?.value;
  if (!token) redirect("/platform/login");
  let adminId: string;
  try {
    adminId = await verifyPlatformToken(token);
  } catch {
    redirect("/platform/login");
  }
  const admin = await getPlatformAdminById(adminId);
  if (!admin || admin.status !== "active") {
    await clearPlatformSession();
    redirect("/platform/login");
  }
  return admin;
}
