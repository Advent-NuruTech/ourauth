import { cookies } from "next/headers";
import type { Environment } from "../apps";

/**
 * The developer dashboard is "dual-mode": a single global toggle selects whether
 * the operator is looking at the `test` or `live` side of their apps. The choice
 * is stored in a cookie so it persists across navigations. Test is the safe
 * default so a fresh session never lands on production data by accident.
 */
const ENV_COOKIE = "ants_dev_env";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getActiveEnvironment(): Promise<Environment> {
  const value = (await cookies()).get(ENV_COOKIE)?.value;
  return value === "live" ? "live" : "test";
}

export async function setActiveEnvironment(env: Environment): Promise<void> {
  (await cookies()).set(ENV_COOKIE, env, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR,
  });
}
