import { NextResponse, type NextRequest } from "next/server";

/**
 * Ants proxy (Next 16's renamed Middleware).
 *  - Adds hardening headers to every response.
 *  - Handles CORS for the public auth API (token-based, so no credentials).
 *    Per-app Origin allow-listing is still enforced inside the handlers.
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
};

function applySecurity(res: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.headers.set(k, v);
  return res;
}

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Ants-Key",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthApi = pathname.startsWith("/api/v1/auth");
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS" && isAuthApi) {
    return applySecurity(new NextResponse(null, { status: 204, headers: corsHeaders(origin) }));
  }

  const res = applySecurity(NextResponse.next());
  if (isAuthApi) {
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/.well-known/:path*"],
};
