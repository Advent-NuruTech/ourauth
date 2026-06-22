import {
  generateKeyPair,
  exportJWK,
  importPKCS8,
  type JWK,
  type KeyLike,
} from "jose";
import { randomBytes } from "crypto";
import { sql, jsonb } from "../db";
import { encrypt, decrypt } from "./encryption";

const ALG = "EdDSA"; // Ed25519

export type ActiveSigningKey = {
  kid: string;
  privateKey: KeyLike;
};

type KeyRow = { kid: string; private_key_enc: string; status: string };

/**
 * Generate a new Ed25519 signing key, persist it (private key encrypted at rest),
 * mark it active and demote any previous active key to "retiring" (still served
 * via JWKS so in-flight tokens keep verifying). Returns the new kid.
 */
export async function rotateSigningKey(): Promise<string> {
  const { publicKey, privateKey } = await generateKeyPair("Ed25519", {
    extractable: true,
  });
  const kid = randomBytes(8).toString("hex");
  const publicJwk = await exportJWK(publicKey);
  publicJwk.kid = kid;
  publicJwk.alg = ALG;
  publicJwk.use = "sig";

  const { exportPKCS8 } = await import("jose");
  const pkcs8 = await exportPKCS8(privateKey);
  const enc = encrypt(pkcs8);

  await sql.begin(async (tx) => {
    await tx`update signing_keys set status = 'retiring' where status = 'active'`;
    await tx`
      insert into signing_keys (kid, alg, public_jwk, private_key_enc, status)
      values (${kid}, ${ALG}, ${jsonb(publicJwk)}, ${enc}, 'active')
    `;
  });
  return kid;
}

let activeCache: { value: ActiveSigningKey; at: number } | null = null;

/** Load the active signing key (cached for 60s). */
export async function getActiveSigningKey(): Promise<ActiveSigningKey> {
  if (activeCache && Date.now() - activeCache.at < 60_000) return activeCache.value;
  const rows = await sql<KeyRow[]>`
    select kid, private_key_enc, status from signing_keys
    where status = 'active' order by created_at desc limit 1
  `;
  if (rows.length === 0) {
    throw new Error("No active signing key. Run `npm run keys:rotate` to bootstrap.");
  }
  const privateKey = await importPKCS8(decrypt(rows[0].private_key_enc), ALG);
  const value = { kid: rows[0].kid, privateKey };
  activeCache = { value, at: Date.now() };
  return value;
}

/** Build the public JWKS (active + retiring keys). */
export async function getJwks(): Promise<{ keys: JWK[] }> {
  const rows = await sql<{ public_jwk: JWK }[]>`
    select public_jwk from signing_keys where status in ('active','retiring')
  `;
  return { keys: rows.map((r) => r.public_jwk) };
}
