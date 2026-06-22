# Ants SDK

Two small, dependency-light modules. Copy them into your app (or publish them as a
package).

## `ants-client.ts` — browser

Zero dependencies. Handles sign-up/in, Google redirect, token storage in
`localStorage`, and silent access-token refresh.

```ts
import { AntsClient } from "./ants-client";

const ants = new AntsClient({ baseUrl, publishableKey });
await ants.signUp({ email, password });
await ants.signIn({ email, password });
ants.signInWithGoogle(redirectTo);     // full-page redirect
ants.handleOAuthRedirect();            // call once on your callback page
const session = await ants.getUser();  // null if signed out
const token = await ants.getAccessToken(); // fresh access token for your API calls
await ants.signOut();
```

## `ants-server.ts` — your backend

Requires `jose`. Verifies Ants access tokens **offline** against the JWKS (fetched and
cached); no per-request call to Ants.

```ts
import { AntsVerifier } from "./ants-server";

const ants = new AntsVerifier({ jwksUrl, applicationId });
const claims = await ants.verify(token);
// or: await ants.verifyAuthHeader(req.headers.get("authorization"))
// claims: { sub, aud, sid, email, email_verified, iss, exp, ... }
```

`verify()` throws on an invalid/expired token or `aud` mismatch — wrap it to return 401.
