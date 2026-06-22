# Security model

Ants is designed so a single mistake doesn't cascade. This documents what's enforced
and why.

## Passwords

- Hashed with **scrypt** (memory-hard, `N=2^15, r=8, p=1`), per-password random salt,
  stored as a self-describing string (`scrypt$N$r$p$salt$hash`). The format is versioned
  so Argon2id can be added later without invalidating existing hashes.
- **Strength policy** enforced on signup and reset (length + character classes).
- **Breached-password blocking** via HaveIBeenPwned **k-anonymity** (only the first 5
  chars of the SHA-1 are sent; failures fail open so HIBP downtime can't block signups).
- **Lockout**: after 8 failed logins an account is locked for 15 minutes.
- **Uniform timing**: unknown emails still run a dummy hash verify, so response time
  doesn't reveal whether an account exists.

## Tokens

- **Access token** — short-lived (default 10 min) **Ed25519 (EdDSA) JWT**.
  Claims: `iss=ants`, `aud=<application_id>`, `sub=<user_id>`, `sid`, `email`,
  `email_verified`. Verified **offline** via the JWKS at `/.well-known/jwks.json`.
- **Refresh token** — opaque 256-bit random, stored only as a SHA-256 hash. **Rotates on
  every use.** Each session is a *family*; presenting an already-used or revoked token
  (theft) **revokes the entire family**. Password reset revokes all sessions.
- **Key rotation** — signing keys live in `signing_keys`; private keys are encrypted at
  rest (AES-256-GCM with `ANTS_MASTER_KEY`). `npm run keys:rotate` activates a new key and
  marks the old one `retiring` (still in JWKS until old tokens expire).

## No user enumeration

Login, signup-on-existing, password reset, and verification resend all return generic,
identical responses regardless of whether the account exists.

## Multi-tenant isolation

- End users are unique per `(application_id, email)` — pools never mix across apps.
- A **publishable key** (`pk_`) only identifies an app for end-user flows and is subject
  to the app's **Origin allow-list**.
- A **secret key** (`sk_`) grants management of *its own* application only.
- A **developer management token** grants management of that developer's apps. Account-level
  operations (create/list apps) reject secret keys.

## Transport & headers

- The `proxy.ts` layer sets `Strict-Transport-Security`, `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, and a
  restrictive `Permissions-Policy` on every response.
- CORS for `/api/v1/auth/*` is token-based (no cookies/credentials); the per-app Origin
  allow-list is enforced inside the handlers.

## Rate limiting

Fixed-window limiter (Postgres-backed, `rate_limits` table) on login, signup, refresh,
password reset, and OAuth start — keyed by IP and, where relevant, email/app. Swap in
Redis by replacing the one function in `lib/ants/ratelimit.ts`.

## Audit log

Auth events (logins, failures, refresh, **reuse detection**, resets, OAuth, app/key
changes) are written to `audit_logs` with IP + user agent for forensics.

## Secrets hygiene

- `.env*` is git-ignored. The Supabase **service role key** is server-only and never sent
  to the browser. Per-app OAuth secrets and signing private keys are encrypted at rest.
- **Rotate any credential that has been shared in plaintext** (e.g. a Google client secret
  pasted into chat/tickets).

## Deferred to phase 2

TOTP/MFA (the `mfa_factors` table is reserved), signed webhooks, device management UI.
