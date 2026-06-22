"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/platform", label: "Overview" },
  { href: "/platform/developers", label: "Developers" },
  { href: "/platform/applications", label: "Applications" },
  { href: "/platform/audit", label: "Audit log" },
];

export function PlatformNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {TABS.map((tab) => {
        const active = tab.href === "/platform" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "border-foreground text-foreground"
                : "border-transparent text-zinc-500 hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
