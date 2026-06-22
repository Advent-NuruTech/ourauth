import {
  randomBytes,
  scrypt as _scrypt,
  timingSafeEqual,
  createHash,
  type ScryptOptions,
} from "crypto";

/** Promise wrapper that preserves the options overload (promisify loses it). */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    _scrypt(password, salt, keylen, options, (err, derivedKey) =>
      err ? reject(err) : resolve(derivedKey),
    );
  });
}

/**
 * Password hashing using Node's built-in scrypt (memory-hard, OWASP-accepted,
 * zero native dependencies → identical behavior on Windows / Linux / serverless).
 *
 * Hashes are SELF-DESCRIBING: `scrypt$N$r$p$saltB64$hashB64`. This lets us add
 * Argon2id later (`argon2id$...`) and `verifyPassword` will dispatch on the
 * prefix, so stored hashes never break.
 */
const PARAMS = { N: 1 << 15, r: 8, p: 1, keylen: 32, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const { N, r, p, keylen, maxmem } = PARAMS;
  const derived = (await scrypt(password.normalize("NFKC"), salt, keylen, {
    N,
    r,
    p,
    maxmem,
  })) as Buffer;
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts[0] !== "scrypt" || parts.length !== 6) return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  try {
    const derived = (await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    })) as Buffer;
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/** Basic strength policy. Throw-friendly: returns an error message or null. */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 256) return "Password must be at most 256 characters";
  if (!/[a-zA-Z]/.test(password)) return "Password must contain a letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

/**
 * Check a password against the HaveIBeenPwned breach corpus using k-anonymity:
 * only the first 5 chars of the SHA-1 are sent; the full hash never leaves here.
 * Network failures fail OPEN (do not block signup on HIBP downtime).
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return false;
    const body = await res.text();
    for (const line of body.split("\n")) {
      const [hashSuffix, count] = line.trim().split(":");
      if (hashSuffix === suffix && Number(count) > 0) return true;
    }
    return false;
  } catch {
    return false;
  }
}
