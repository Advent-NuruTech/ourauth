# Quickstart — integrate an app with Ants

This walks through wiring a web app to Ants for email/password + Google sign-in.

## 0. Prerequisites

Ants is running (see the root `README.md`) and you have a developer account.

```bash
# Log in as a developer to get a management token
curl -s -X POST $ANTS/api/v1/admin/login -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","password":"…"}'
```

## 1. Create your application

```bash
curl -s -X POST $ANTS/api/v1/apps \
  -H "Authorization: Bearer <management_token>" -H 'Content-Type: application/json' \
  -d '{
        "name": "My Web App",
        "environment": "live",
        "allowed_origins": ["https://app.example.com"],
        "redirect_uris": ["https://app.example.com/auth/callback"]
      }'
```

The response includes a **publishable key** (`pk_live_…`, safe for the browser) and a
**secret key** (`sk_live_…`, server only — shown once). `allowed_origins` is the CORS
allow-list for browser calls; `redirect_uris` is the allow-list for OAuth returns.

## 2. Use the browser SDK

```ts
import { AntsClient } from "@/sdk/ants-client";

const ants = new AntsClient({
  baseUrl: "https://auth.example.com",   // your Ants deployment
  publishableKey: "pk_live_…",
});

// Email / password
await ants.signUp({ email, password, full_name: "Ada" });
await ants.signIn({ email, password });

// Google — full-page redirect, returns to your redirect_uri
ants.signInWithGoogle("https://app.example.com/auth/callback");

// Current user (auto-refreshes the access token when needed)
const session = await ants.getUser();

await ants.signOut();
```

On your **callback page**, capture the tokens from the URL fragment once:

```ts
// app/auth/callback/page.tsx (client component)
const ants = new AntsClient({ baseUrl, publishableKey });
if (ants.handleOAuthRedirect()) {
  // tokens stored; redirect into the app
}
```

## 3. Protect your own backend

Verify Ants access tokens **offline** (no call back to Ants) using the JWKS:

```ts
import { AntsVerifier } from "@/sdk/ants-server";

const ants = new AntsVerifier({
  jwksUrl: "https://auth.example.com/.well-known/jwks.json",
  applicationId: "<your application id>",   // tokens' `aud`
});

export async function GET(req: Request) {
  const claims = await ants.verifyAuthHeader(req.headers.get("authorization"));
  // claims.sub = user id, claims.email, claims.email_verified
}
```

## 4. Email verification & password reset

- New users get a verification email (unless you set `require_email_verification: false`
  via `PATCH /api/v1/apps/{id}`). The link hits `GET /api/v1/auth/verify-email?token=…`.
- Password reset: `POST /api/v1/auth/password/forgot` → user gets a link to your
  `/reset-password?token=…` page → submit `POST /api/v1/auth/password/reset`.
- In development, emails are printed to the server console. Set `RESEND_API_KEY` and
  `ANTS_EMAIL_FROM` to send real email via Resend.

## 5. Enable per-app Google credentials (optional)

```bash
curl -s -X PATCH $ANTS/api/v1/apps/<id> \
  -H "Authorization: Bearer <management_token>" -H 'Content-Type: application/json' \
  -d '{"google":{"enabled":true,"client_id":"…","client_secret":"…"}}'
```

The secret is encrypted at rest (AES-256-GCM). If omitted, Ants uses the platform-level
Google credentials from the server environment.
