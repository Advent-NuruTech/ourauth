# 🐜 Ants — Authentication as a Service

**Secured by Ants.** A multi-tenant authentication platform (like Clerk/Auth0) you
host yourself, built on **Next.js 16** + **Supabase Postgres**. One deployment serves
**many developers**, each with **many apps**, each app with an **isolated end-user pool**
and its own API keys. Email/password and "Continue with Google" out of the box,
hardened for production and built to scale to 1M+ users.

- **API-first** — clean, versioned REST under `/api/v1`. Interactive docs at `/docs`.
- **Stateless verification** — short-lived **Ed25519 JWT** access tokens; verify offline via JWKS.
- **Rotating refresh tokens** with reuse detection (theft revokes the whole session family).
- **Security defaults** — scrypt password hashing, breached-password blocking (HIBP),
  per-account lockout, rate limiting, no user enumeration, encrypted secrets at rest, CORS + hardening headers.

> Two SDKs are included: a browser client (`sdk/ants-client.ts`) and a server-side
> token verifier (`sdk/ants-server.ts`).

---

## Architecture in one minute

Three identity layers:

| Layer | Table | Who | Auth |
|------|-------|-----|------|
| **Developer** | `developers` | Your customers (tenant owners) | Management token (signup gated by `ADMIN_SIGNUP_CODE`) |
| **Application** | `applications` | A developer's app | Publishable key `pk_…` (client) + Secret key `sk_…` (server) |
| **End user** | `app_users` | The app's users | Access JWT + rotating refresh token |

- **Auth API** `/api/v1/auth/*` — used by your app; send `X-Ants-Key: pk_…`.
- **Management API** `/api/v1/apps/*`, `/api/v1/admin/*` — `Authorization: Bearer <management-token | sk_…>`.

See [`docs/security.md`](docs/security.md) for the full threat model and token design.

---

## Setup

### 1. Configure environment

Copy `.env.example` → `.env.local` and fill it in. Required:

```bash
ANTS_BASE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres.<ref>:<url-encoded-password>@aws-0-<region>.pooler.supabase.com:6543/postgres?sslmode=require
ANTS_MASTER_KEY=<openssl rand -base64 32>
ADMIN_SIGNUP_CODE=<a long random string>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

> **`DATABASE_URL`** is the Supabase **Transaction pooler** string
> (Project → Settings → Database → Connection string → *Transaction*). Use the pooler
> (port `6543`), not the direct connection — it's what scales under serverless.
> URL-encode special characters in the password (`/` → `%2F`).

### 2. Install, migrate, bootstrap keys

```bash
npm install
npm run db:migrate        # creates all tables (idempotent)
npm run keys:rotate       # generates the first Ed25519 signing key (run again to rotate)
```

### 3. Google OAuth (optional but recommended)

In Google Cloud Console → Credentials → your OAuth client, add the authorized redirect URI:

```
${ANTS_BASE_URL}/api/v1/auth/oauth/google/callback
```

You can use these platform-level Google credentials as the default, or set **per-app**
Google credentials via `PATCH /api/v1/apps/{id}`.

### 4. Run

```bash
npm run dev          # http://localhost:3000  → landing page + /docs
```

---

## Quick smoke test

```bash
B=http://localhost:3000

# 1) Create a developer (tenant)
curl -s -X POST $B/api/v1/admin/signup -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"Sup3rSecret!","code":"<ADMIN_SIGNUP_CODE>"}'
# → { developer, management_token }

# 2) Create an app (use the management_token)
curl -s -X POST $B/api/v1/apps -H "Authorization: Bearer <management_token>" \
  -H 'Content-Type: application/json' -d '{"name":"My App","environment":"test"}'
# → { application, keys: { publishable_key, secret_key } }

# 3) Sign up an end user (use the publishable_key)
curl -s -X POST $B/api/v1/auth/signup -H "X-Ants-Key: pk_test_…" \
  -H 'Content-Type: application/json' -d '{"email":"user@example.com","password":"Us3rPassw0rd!"}'
# → { user, access_token, refresh_token, … }
```

Full integration guide: [`docs/quickstart.md`](docs/quickstart.md) ·
Endpoint reference: [`docs/api.md`](docs/api.md) or the interactive `/docs`.

---

## Project layout

```
app/
  api/v1/                 REST route handlers (auth + management)
  .well-known/jwks.json/  public signing keys
  docs/                   interactive API reference (Scalar)
lib/ants/                 the auth core (crypto, db, sessions, oauth, …)
sdk/                      ants-client.ts (browser) + ants-server.ts (verifier)
db/migrations/            SQL schema
scripts/                  migrate.ts, rotate-signing-key.ts
proxy.ts                  security headers + CORS (Next 16 "Proxy" = middleware)
```

## Operations

- **Rotate signing keys**: `npm run keys:rotate`. The previous key becomes `retiring`
  and is still published in JWKS so existing tokens keep verifying until they expire.
- **Scaling**: stateless JWT verification means only refresh/login hit the DB. For very
  high throughput, swap the Postgres rate limiter (`lib/ants/ratelimit.ts`) for Redis —
  it's behind a single function.

## Roadmap (phase 2)

Developer dashboard UI · Ants-hosted sign-in pages · TOTP/MFA (schema reserved) ·
signed webhooks · more OAuth providers.
