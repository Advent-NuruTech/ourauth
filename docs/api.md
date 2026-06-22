# API reference

Base path: `/api/v1`. Interactive version: open `/docs`. Machine-readable spec:
`/openapi.yaml`.

All responses are JSON. Errors use:

```json
{ "error": { "code": "invalid_credentials", "message": "Invalid email or password", "details": {} } }
```

## Authentication of requests

| Surface | Header |
|--------|--------|
| Auth API (`/auth/*`) | `X-Ants-Key: pk_…` (+ `Authorization: Bearer <access>` for `/auth/me`) |
| Management API | `Authorization: Bearer <management_token \| sk_…>` |
| JWKS | none (public) |

---

## Auth API (publishable key)

| Method | Path | Body | Notes |
|-------|------|------|-------|
| POST | `/auth/signup` | `{email, password, full_name?}` | → `{user, …tokens}` (201) |
| POST | `/auth/login` | `{email, password}` | → `{user, …tokens}` |
| POST | `/auth/token/refresh` | `{refresh_token}` | rotates; old token dies |
| POST | `/auth/logout` | `{refresh_token?}` | revokes the session |
| GET | `/auth/me` | — | Bearer access token → `{user}` |
| GET/POST | `/auth/verify-email` | `?token=` / `{token}` | single-use link |
| POST | `/auth/verify-email/resend` | `{email}` | no enumeration |
| POST | `/auth/password/forgot` | `{email}` | always 200; no enumeration |
| POST | `/auth/password/reset` | `{token, password}` | revokes all sessions |
| GET | `/auth/oauth/google/start` | `?key=pk_…&redirect_to=` | 302 → Google |
| GET | `/auth/oauth/google/callback` | — | 302 → `redirect_to#access_token=…` |

**Token bundle**: `{ access_token, refresh_token, token_type: "Bearer", expires_in }`.

---

## Management API

### Developer accounts

| Method | Path | Body |
|-------|------|------|
| POST | `/admin/signup` | `{email, password, name?, code}` → `{developer, management_token}` |
| POST | `/admin/login` | `{email, password}` → `{developer, management_token}` |

### Applications & keys (management token, or `sk_` scoped to its app)

| Method | Path | Body / notes |
|-------|------|--------------|
| GET | `/apps` | list (management token only) |
| POST | `/apps` | `{name, environment?, allowed_origins?, redirect_uris?}` → app + initial keys |
| GET | `/apps/{id}` | get one |
| PATCH | `/apps/{id}` | `{name?, allowed_origins?, redirect_uris?, require_email_verification?, google?}` |
| DELETE | `/apps/{id}` | delete |
| GET | `/apps/{id}/keys` | metadata only (never the raw key) |
| POST | `/apps/{id}/keys` | `{type: "pk"\|"sk"}` → raw key once |
| GET | `/apps/{id}/users` | `?search=&limit=&offset=` |

---

## Keys

| Method | Path | Notes |
|-------|------|-------|
| GET | `/.well-known/jwks.json` | Ed25519 public keys for offline JWT verification |

## Common error codes

`invalid_request` (400) · `unauthorized` (401) · `invalid_token` (401) ·
`invalid_credentials` (401) · `forbidden` (403) · `not_found` (404) ·
`conflict` (409) · `rate_limited` (429, includes `Retry-After`).
