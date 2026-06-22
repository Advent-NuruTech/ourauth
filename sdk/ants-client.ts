/**
 * Ants browser SDK — framework-agnostic, zero dependencies.
 *
 *   import { AntsClient } from "@/sdk/ants-client";
 *   const ants = new AntsClient({
 *     baseUrl: "https://auth.example.com",
 *     publishableKey: "pk_live_xxx",
 *   });
 *   await ants.signUp({ email, password });
 *   await ants.signIn({ email, password });
 *   ants.signInWithGoogle("https://app.example.com/callback");
 *   const { user } = await ants.getUser();
 *
 * Tokens are persisted in localStorage and the access token is silently
 * refreshed when expired. Call `handleOAuthRedirect()` once on your callback page.
 */
export type AntsTokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
};

export type AntsUser = {
  id: string;
  email: string;
  email_verified: boolean;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

/** The current user plus the dynamic roles/permissions assigned to them. */
export type AntsSession = {
  user: AntsUser;
  environment: "live" | "test";
  roles: string[];
  permissions: string[];
};

export type AntsClientOptions = {
  baseUrl: string;
  publishableKey: string;
  storageKey?: string;
};

type Stored = AntsTokens & { obtained_at: number };

export class AntsError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class AntsClient {
  private baseUrl: string;
  private pk: string;
  private storageKey: string;

  constructor(opts: AntsClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.pk = opts.publishableKey;
    this.storageKey = opts.storageKey ?? "ants.session";
  }

  // ── token storage ──────────────────────────────────────────────────────
  private read(): Stored | null {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(this.storageKey);
    return raw ? (JSON.parse(raw) as Stored) : null;
  }
  private write(tokens: AntsTokens) {
    if (typeof localStorage === "undefined") return;
    const stored: Stored = { ...tokens, obtained_at: Date.now() };
    localStorage.setItem(this.storageKey, JSON.stringify(stored));
  }
  private clear() {
    if (typeof localStorage !== "undefined") localStorage.removeItem(this.storageKey);
  }

  private async request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    headers.set("X-Ants-Key", this.pk);
    if (init.auth) {
      const token = await this.getAccessToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
    }
    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = body?.error ?? {};
      throw new AntsError(res.status, e.code ?? "error", e.message ?? "Request failed", e.details);
    }
    return body as T;
  }

  // ── auth flows ─────────────────────────────────────────────────────────
  async signUp(input: { email: string; password: string; full_name?: string }) {
    const data = await this.request<{ user: AntsUser } & AntsTokens>("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify(input),
    });
    this.write(data);
    return data;
  }

  async signIn(input: { email: string; password: string }) {
    const data = await this.request<{ user: AntsUser } & AntsTokens>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
    this.write(data);
    return data;
  }

  /** Redirect the browser to Google. `redirectTo` must be allow-listed for the app. */
  signInWithGoogle(redirectTo: string) {
    const url = new URL(`${this.baseUrl}/api/v1/auth/oauth/google/start`);
    url.searchParams.set("key", this.pk);
    url.searchParams.set("redirect_to", redirectTo);
    window.location.href = url.toString();
  }

  /** Call on your OAuth callback page to capture tokens from the URL fragment. */
  handleOAuthRedirect(): boolean {
    if (typeof window === "undefined" || !window.location.hash) return false;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return false;
    this.write({
      access_token,
      refresh_token,
      expires_in: Number(params.get("expires_in") ?? 600),
      token_type: "Bearer",
    });
    history.replaceState(null, "", window.location.pathname + window.location.search);
    return true;
  }

  async getUser(): Promise<{ user: AntsUser } | null> {
    const session = await this.getSession();
    return session ? { user: session.user } : null;
  }

  /**
   * Like getUser, but also returns the environment and the user's dynamic roles
   * and permission keys. Use `permissions` to gate UI; never trust it for
   * authorization decisions you can make on your own backend.
   */
  async getSession(): Promise<AntsSession | null> {
    if (!this.read()) return null;
    try {
      return await this.request<AntsSession>("/api/v1/auth/me", { auth: true });
    } catch {
      return null;
    }
  }

  /** Convenience permission check against the current session. */
  async can(permission: string): Promise<boolean> {
    const session = await this.getSession();
    return Boolean(session?.permissions.includes(permission));
  }

  async signOut() {
    const stored = this.read();
    if (stored) {
      await this.request("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: stored.refresh_token }),
      }).catch(() => {});
    }
    this.clear();
  }

  /** Returns a valid access token, refreshing it first if it is near expiry. */
  async getAccessToken(): Promise<string | null> {
    const stored = this.read();
    if (!stored) return null;
    const ageMs = Date.now() - stored.obtained_at;
    const expiresInMs = stored.expires_in * 1000;
    if (ageMs < expiresInMs - 30_000) return stored.access_token; // 30s skew
    return this.refresh();
  }

  private async refresh(): Promise<string | null> {
    const stored = this.read();
    if (!stored) return null;
    try {
      const data = await this.request<AntsTokens>("/api/v1/auth/token/refresh", {
        method: "POST",
        body: JSON.stringify({ refresh_token: stored.refresh_token }),
      });
      this.write(data);
      return data.access_token;
    } catch {
      this.clear();
      return null;
    }
  }
}
