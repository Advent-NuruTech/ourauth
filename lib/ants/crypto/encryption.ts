import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { getConfig } from "../config";

/**
 * AES-256-GCM encryption for secrets at rest (e.g. per-app OAuth client secrets,
 * signing private keys). Output format: base64( iv[12] | authTag[16] | ciphertext ).
 */
function key(): Buffer {
  return Buffer.from(getConfig().ANTS_MASTER_KEY, "base64");
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
