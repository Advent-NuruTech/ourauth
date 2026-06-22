import { sql } from "./db";
import { Errors } from "./errors";

/**
 * Fixed-window rate limiter backed by Postgres. Behind a single function so a
 * Redis (Upstash) implementation can be dropped in later without touching callers.
 */
export type RateLimitRule = { limit: number; windowSec: number };

export const RateLimits = {
  login: { limit: 10, windowSec: 300 }, // 10 / 5min per ip+email
  signup: { limit: 20, windowSec: 3600 }, // 20 / hour per ip
  forgot: { limit: 5, windowSec: 3600 }, // 5 / hour per ip+email
  refresh: { limit: 60, windowSec: 60 }, // 60 / min per ip
  oauthStart: { limit: 30, windowSec: 300 },
} as const satisfies Record<string, RateLimitRule>;

/**
 * Increment the counter for `key` within the current window and return whether
 * it is allowed plus seconds until reset.
 */
export async function rateLimit(
  key: string,
  rule: RateLimitRule,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const now = Date.now();
  const windowMs = rule.windowSec * 1000;
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const retryAfter = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);

  const rows = await sql<{ count: number }[]>`
    insert into rate_limits (bucket_key, window_start, count)
    values (${key}, ${windowStart}, 1)
    on conflict (bucket_key, window_start)
    do update set count = rate_limits.count + 1
    returning count
  `;
  const count = rows[0]?.count ?? 1;
  return { allowed: count <= rule.limit, retryAfter };
}

/** Throwing variant used inside route handlers. */
export async function enforceRateLimit(key: string, rule: RateLimitRule): Promise<void> {
  const { allowed, retryAfter } = await rateLimit(key, rule);
  if (!allowed) throw Errors.rateLimited(retryAfter);
}
