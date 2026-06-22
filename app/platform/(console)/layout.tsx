import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/ants/dashboard/session";
import { platformLogoutAction } from "../actions";
import { PlatformNav } from "./nav";

export default async function PlatformConsoleLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdmin();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/10 bg-background/80 backdrop-blur dark:border-white/10">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/platform" className="flex items-center gap-2 font-semibold">
            <span className="text-xl">🐜</span> Ants
            <span className="ml-2 rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-600 dark:text-violet-400">
              Platform
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-zinc-500 sm:inline">{admin.email}</span>
            <form action={platformLogoutAction}>
              <button className="rounded-lg border border-black/15 px-3 py-1.5 font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
                Sign out
              </button>
            </form>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-6">
          <PlatformNav />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
