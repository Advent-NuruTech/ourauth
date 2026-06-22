import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 text-lg font-semibold"
        >
          <Image
            src="/logo.jpg"
            alt="Ants"
            width={32}
            height={32}
            priority
            className="rounded-lg"
          />
          Ants
        </Link>
        {children}
      </div>
    </main>
  );
}
