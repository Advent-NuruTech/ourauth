import Link from "next/link";

export default function PlatformAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold">
          <span className="text-2xl">🐜</span> Ants
          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-white/10">
            Platform
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
