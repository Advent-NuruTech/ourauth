import Link from "next/link";
import Image from "next/image";

const DOCS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2.5 text-lg font-semibold">
        <Image src="/logo.jpg" alt="Ants" width={28} height={28} className="rounded-lg" />
        Ants
      </Link>

      <nav className="mb-10 flex flex-wrap gap-x-5 gap-y-2 border-b border-border pb-4 text-sm">
        {DOCS.map((d) => (
          <Link key={d.href} href={d.href} className="text-muted hover:text-foreground">
            {d.label}
          </Link>
        ))}
      </nav>

      <article
        className="
          space-y-4
          [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight
          [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold
          [&_h3]:mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground
          [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted
          [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-muted
          [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5
          [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5
          [&_ol_li]:text-sm [&_ol_li]:leading-relaxed [&_ol_li]:text-muted
          [&_strong]:font-semibold [&_strong]:text-foreground
          [&_code]:rounded [&_code]:bg-muted/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.8125rem]
          [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2
          [&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
          [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold
          [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:align-top [&_td]:text-muted
        "
      >
        {children}
      </article>

      <footer className="mt-16 border-t border-border pt-6 text-xs text-muted">
        © {new Date().getFullYear()} Ants. Authentication as a Service.{" "}
        <Link href="/" className="underline underline-offset-2">
          Back to home
        </Link>
      </footer>
    </main>
  );
}
