import Link from "next/link";
import { requireDeveloper } from "@/lib/ants/dashboard/session";
import { getActiveEnvironment } from "@/lib/ants/dashboard/environment";
import { signOutAction } from "../(auth)/actions";
import { EnvSwitch } from "./env-switch";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const dev = await requireDeveloper();
  const env = await getActiveEnvironment();
  const isLive = env === "live";

  return (
    <div data-env={env} className="flex flex-1 flex-col">
      {/* Mode bar — full-width, accent-colored, states the active environment. */}
      <div
        className="h-1 w-full"
        style={{ background: "var(--env)" }}
        aria-hidden
      />
      <header className="sticky top-0 z-20 border-b border-border bg-background/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="text-xl">🐜</span> Ants
            </Link>
            <span className="hidden rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-muted sm:inline dark:bg-white/10">
              Developer
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <EnvSwitch current={env} />
            <Link href="/docs" className="hidden text-muted hover:text-foreground sm:inline">
              Docs
            </Link>
            <span className="hidden text-muted lg:inline">{dev.email}</span>
            <form action={signOutAction}>
              <button className="rounded-xl border border-border px-3 py-1.5 font-medium transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {/* Inline environment context strip. */}
        <div
          className="border-t border-border"
          style={{ background: "var(--env-soft)" }}
        >
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-1.5 text-xs">
            <span
              className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide"
              style={{ color: "var(--env)" }}
            >
              <span className="size-1.5 rounded-full" style={{ background: "var(--env)" }} />
              {env} mode
            </span>
            <span className="text-muted">
              {isLive
                ? "You are viewing real production data — keys, users and roles here affect live users."
                : "Sandbox data, fully isolated from live. Safe to experiment."}
            </span>
          </div>
        </div>
      </header>
      <main className="ants-fade-in mx-auto w-full max-w-6xl flex-1 px-6 py-10" key={env}>
        {children}
      </main>
    </div>
  );
}
