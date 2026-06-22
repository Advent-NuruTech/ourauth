import Link from "next/link";

/**
 * Ants presentational kit — shared by the landing page and both consoles. These
 * are server components (no interactivity); interactive pieces live in
 * ./form.tsx. Styling reads from the design tokens in globals.css.
 */

// ── Surfaces ──────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Tag
      className={`rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(9,9,11,0.04)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted">{label}</div>
        {icon ? <div className="text-muted">{icon}</div> : null}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-xs text-muted">{hint}</div> : null}
    </Card>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────

const BADGE_TONES: Record<string, string> = {
  green: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20",
  red: "bg-red-500/12 text-red-700 dark:text-red-300 ring-red-500/20",
  amber: "bg-amber-500/14 text-amber-700 dark:text-amber-300 ring-amber-500/20",
  blue: "bg-blue-500/12 text-blue-700 dark:text-blue-300 ring-blue-500/20",
  indigo: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-indigo-500/20",
  zinc: "bg-zinc-500/12 text-zinc-600 dark:text-zinc-300 ring-zinc-500/20",
};

export function Badge({
  tone = "zinc",
  children,
  className = "",
}: {
  tone?: keyof typeof BADGE_TONES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_TONES[tone] ?? BADGE_TONES.zinc} ${className}`}
    >
      {children}
    </span>
  );
}

/** Environment pill — always rendered identically so live/test read at a glance. */
export function EnvBadge({ environment }: { environment: "live" | "test" }) {
  return (
    <Badge tone={environment === "live" ? "green" : "amber"} className="uppercase tracking-wide">
      <span className={`size-1.5 rounded-full ${environment === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
      {environment}
    </Badge>
  );
}

// ── Headers / empty states ────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      {icon ? <div className="text-3xl opacity-80">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {body ? <p className="max-w-sm text-sm text-muted">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </Card>
  );
}

// ── Form primitives ───────────────────────────────────────────────────────────

const INPUT_CLASS =
  "w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/30";

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  required,
  hint,
  autoComplete,
  mono,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
        className={`${INPUT_CLASS} ${mono ? "font-mono" : ""}`}
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Textarea({
  label,
  name,
  rows = 3,
  placeholder,
  defaultValue,
  hint,
  mono,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className={`${INPUT_CLASS} resize-y ${mono ? "font-mono" : ""}`}
      />
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export { INPUT_CLASS };

// ── Buttons ───────────────────────────────────────────────────────────────────

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";
const BTN_VARIANTS = {
  primary:
    "bg-brand text-[var(--brand-foreground)] hover:bg-[var(--brand-hover)] shadow-sm",
  secondary:
    "border border-border bg-surface hover:border-[var(--border-strong)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]",
  ghost: "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
  danger:
    "border border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400",
  env: "text-white shadow-sm bg-[var(--env)] hover:opacity-90",
};

export function LinkButton({
  href,
  variant = "primary",
  children,
  className = "",
}: {
  href: string;
  variant?: keyof typeof BTN_VARIANTS;
  children: React.ReactNode;
  className?: string;
}) {
  const external = href.startsWith("http") || href.startsWith("/.well-known");
  const cls = `${BTN_BASE} ${BTN_VARIANTS[variant]} ${className}`;
  return external ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export { BTN_BASE, BTN_VARIANTS };

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export function SuccessBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
      {message}
    </p>
  );
}

/** A small mono token chip used for keys, permission names, etc. */
export function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-black/[0.05] px-1.5 py-0.5 font-mono text-xs dark:bg-white/[0.08]">
      {children}
    </code>
  );
}
