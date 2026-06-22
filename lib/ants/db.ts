import postgres, { type TransactionSql } from "postgres";
import { getConfig } from "./config";

/**
 * Singleton pooled Postgres client (postgres.js).
 *
 * In serverless/dev the module may be re-evaluated; we cache on globalThis to
 * avoid exhausting connections. Tuned conservatively for Supabase's pooler.
 */
declare global {
  var __ants_sql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = getConfig().DATABASE_URL;
  const isLocal = /@(localhost|127\.0\.0\.1)/.test(url);
  return postgres(url, {
    max: 10, // per serverless instance; raise behind a dedicated pooler
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false, // required for transaction-mode poolers (Supabase 6543)
    ssl: isLocal ? false : "require", // Supabase pooler requires TLS
  });
}

export const sql = globalThis.__ants_sql ?? create();
if (process.env.NODE_ENV !== "production") globalThis.__ants_sql = sql;

export type Sql = typeof sql;
/** The scoped client passed into `sql.begin` transaction callbacks. */
export type Tx = TransactionSql<Record<string, never>>;

/**
 * Wrap an arbitrary value as a JSONB parameter. postgres.js's `sql.json` has a
 * strict `JSONValue` signature that rejects our `unknown`/optional-field objects,
 * so we centralize the (safe) cast here instead of scattering it across callers.
 */
export function jsonb(value: unknown) {
  return sql.json(value as Parameters<typeof sql.json>[0]);
}
