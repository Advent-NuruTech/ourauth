import { NextResponse } from "next/server";
import { getJwks } from "@/lib/ants/crypto/keys";
import { handler } from "@/lib/ants/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public JSON Web Key Set so apps can verify Ants access tokens offline.
export const GET = handler(async () => {
  const jwks = await getJwks();
  return NextResponse.json(jwks, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=60" },
  });
});
