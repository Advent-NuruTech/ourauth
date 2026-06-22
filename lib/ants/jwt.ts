import { SignJWT, jwtVerify, createLocalJWKSet, type JWTPayload } from "jose";
import { getActiveSigningKey, getJwks } from "./crypto/keys";
import { getConfig } from "./config";

export type AccessClaims = {
  sub: string; // app_user_id
  aud: string; // application_id
  sid: string; // session_id
  env: "live" | "test"; // environment the user belongs to
  email: string;
  email_verified: boolean;
};

/** Issue a short-lived access JWT signed with the active Ed25519 key. */
export async function issueAccessToken(claims: AccessClaims): Promise<string> {
  const cfg = getConfig();
  const { kid, privateKey } = await getActiveSigningKey();
  return new SignJWT({
    email: claims.email,
    email_verified: claims.email_verified,
    sid: claims.sid,
    env: claims.env,
  })
    .setProtectedHeader({ alg: "EdDSA", kid, typ: "JWT" })
    .setIssuer(cfg.ISSUER)
    .setSubject(claims.sub)
    .setAudience(claims.aud)
    .setIssuedAt()
    .setExpirationTime(`${cfg.ANTS_ACCESS_TTL}s`)
    .sign(privateKey);
}

/**
 * Verify an access token locally (no network) against the current JWKS.
 * Used by Ants's own endpoints; app backends use the SDK's remote verifier.
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload & AccessClaims> {
  const cfg = getConfig();
  const jwks = createLocalJWKSet(await getJwks());
  const { payload } = await jwtVerify(token, jwks, { issuer: cfg.ISSUER });
  return payload as JWTPayload & AccessClaims;
}
