import Link from "next/link";
import { LinkButton, Badge, Card } from "@/app/ui/kit";

const FEATURES: [string, string, string][] = [
  ["🔐", "Drop-in auth", "Email + password and Continue with Google, with verification, password reset and breach checks built in."],
  ["🧪", "Live & test, side by side", "Every app runs in both modes at once — isolated keys, users and roles. Switch with one click, never confuse them."],
  ["🧩", "Dynamic roles & permissions", "Define your own roles and permissions per app via API or SDK. No built-in roles, no assumptions about your domain."],
  ["🛡️", "Hardened by default", "Ed25519 JWTs, rotating refresh tokens with reuse detection, per-app origin allow-lists and rate limits."],
  ["🏢", "Multi-tenant", "Many developers, many apps, fully isolated end-user pools. Built to host more than one product."],
  ["⚡", "Offline verification", "Verify access tokens in your backend with the SDK against cached JWKS — zero round-trips per request."],
];

const CODE = `import { AntsClient } from "@ants/client";

const ants = new AntsClient({
  baseUrl: "https://auth.example.com",
  publishableKey: "pk_test_…",
});

await ants.signUp({ email, password });
const session = await ants.getSession();
//    ⤷ { user, environment, roles, permissions }

if (await ants.can("invoices:read")) {
  // gate UI on dynamic permissions
}`;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="text-xl">🐜</span> Ants
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/docs" className="rounded-lg px-3 py-2 text-muted hover:text-foreground">
              Docs
            </Link>
            <a href="/.well-known/jwks.json" className="rounded-lg px-3 py-2 text-muted hover:text-foreground">
              JWKS
            </a>
            <Link href="/platform" className="rounded-lg px-3 py-2 text-muted hover:text-foreground">
              Platform
            </Link>
            <LinkButton href="/dashboard" variant="primary" className="ml-2">
              Open dashboard
            </LinkButton>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(60% 50% at 50% -10%, color-mix(in srgb, var(--brand) 22%, transparent), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
          <Badge tone="indigo">Authentication as a Service</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Auth your users will never
            <br className="hidden sm:block" /> notice — and you’ll never fight.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Ants gives every app a secure auth backend, a fully dynamic permission system,
            and live + test environments that stay impossible to confuse.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/dashboard" variant="primary">
              Start building →
            </LinkButton>
            <LinkButton href="/docs" variant="secondary">
              Read the docs
            </LinkButton>
          </div>
          <p className="text-xs text-muted">
            Ed25519 · rotating refresh tokens · breach checks · per-app origin allow-lists
          </p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([icon, title, body]) => (
            <Card key={title} className="p-6 transition hover:border-[var(--border-strong)]">
              <div className="text-2xl">{icon}</div>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Code sample */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Badge tone="indigo">For developers</Badge>
            <h2 className="text-3xl font-semibold tracking-tight">
              A few lines to wire up. Zero lines you didn’t mean to write.
            </h2>
            <p className="text-muted">
              The browser SDK manages tokens and silent refresh; the server SDK verifies them
              offline. Roles and permissions you define flow straight into the session.
            </p>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              {["Publishable keys for clients, secret keys for your backend", "Roles & permissions managed entirely by your app", "Switch the active environment without touching code"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-0.5 text-emerald-500">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <Card className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <span className="size-3 rounded-full bg-red-400/70" />
              <span className="size-3 rounded-full bg-amber-400/70" />
              <span className="size-3 rounded-full bg-emerald-400/70" />
              <span className="ml-2 text-xs text-muted">app/auth.ts</span>
            </div>
            <pre className="overflow-x-auto px-5 py-4 text-[13px] leading-relaxed">
              <code className="font-mono text-foreground/90">{CODE}</code>
            </pre>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-24">
        <Card className="flex flex-col items-center gap-5 px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ship auth this afternoon.</h2>
          <p className="max-w-md text-muted">
            Create an app, grab your test keys, and integrate in minutes. Flip to live when you’re ready.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/dashboard" variant="primary">
              Open the dashboard
            </LinkButton>
            <LinkButton href="/docs" variant="secondary">
              API reference
            </LinkButton>
          </div>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted sm:flex-row">
          <span className="flex items-center gap-2">
            <span>🐜</span> Ants — secured by Ants.
          </span>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
            <a href="/.well-known/jwks.json" className="hover:text-foreground">JWKS</a>
            <Link href="/platform" className="hover:text-foreground">Platform console</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
