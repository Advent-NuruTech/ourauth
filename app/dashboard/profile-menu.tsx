"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "../(auth)/actions";

/**
 * Account avatar + dropdown. Shown at every breakpoint (the old plain-text email
 * was hidden below `lg`), so the developer always has one tap to their email,
 * account settings and sign-out. Closes on outside-click and Escape.
 */
export function ProfileMenu({ email, name }: { email: string; name: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials =
    (name?.trim() || email)
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "👤";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex size-9 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold tracking-tight text-foreground transition hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {initials}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium">{name || "Developer"}</p>
            <p className="truncate text-xs text-muted">{email}</p>
          </div>
          <div className="p-1.5">
            <Link
              href="/dashboard/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
            >
              <span aria-hidden>⚙️</span> Account settings
            </Link>
            <Link
              href="/docs"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-black/[0.04] sm:hidden dark:hover:bg-white/[0.06]"
            >
              <span aria-hidden>📖</span> Docs
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
              >
                <span aria-hidden>↩</span> Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
