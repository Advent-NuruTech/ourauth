import { NextResponse } from "next/server";

/**
 * Typed API error. Messages are intentionally generic for auth flows to avoid
 * user enumeration; codes let clients branch programmatically.
 */
export class AntsError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AntsError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  invalidRequest: (msg = "Invalid request", details?: unknown) =>
    new AntsError(400, "invalid_request", msg, details),
  unauthorized: (msg = "Authentication required") =>
    new AntsError(401, "unauthorized", msg),
  invalidCredentials: () =>
    // Same message for "no such user" and "wrong password" (no enumeration).
    new AntsError(401, "invalid_credentials", "Invalid email or password"),
  forbidden: (msg = "Forbidden") => new AntsError(403, "forbidden", msg),
  notFound: (msg = "Not found") => new AntsError(404, "not_found", msg),
  conflict: (msg = "Already exists") => new AntsError(409, "conflict", msg),
  rateLimited: (retryAfter: number) =>
    new AntsError(429, "rate_limited", "Too many requests", { retry_after: retryAfter }),
  invalidToken: (msg = "Invalid or expired token") =>
    new AntsError(401, "invalid_token", msg),
  server: (msg = "Internal server error") => new AntsError(500, "server_error", msg),
};

type Json = Record<string, unknown>;

export function jsonOk(data: Json, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/** Convert any thrown value into a safe JSON response. */
export function toResponse(err: unknown): NextResponse {
  if (err instanceof AntsError) {
    const body: Json = { error: { code: err.code, message: err.message } };
    if (err.details !== undefined) (body.error as Json).details = err.details;
    const headers: Record<string, string> = {};
    if (err.code === "rate_limited" && err.details && typeof err.details === "object") {
      const ra = (err.details as { retry_after?: number }).retry_after;
      if (ra) headers["Retry-After"] = String(ra);
    }
    return NextResponse.json(body, { status: err.status, headers });
  }
  // Never leak internals.
  console.error("[ants] unhandled error:", err);
  return NextResponse.json(
    { error: { code: "server_error", message: "Internal server error" } },
    { status: 500 },
  );
}

/** Wrap a route handler so thrown AntsErrors become clean responses. */
export function handler<Args extends unknown[]>(
  fn: (...args: Args) => Promise<NextResponse>,
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (err) {
      return toResponse(err);
    }
  };
}
