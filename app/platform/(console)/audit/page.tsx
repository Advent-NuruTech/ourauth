import type { Metadata } from "next";
import { listRecentAudit } from "@/lib/ants/platform";
import { Card, PageHeader, Badge, EmptyState } from "@/app/ui/kit";

export const metadata: Metadata = { title: "Audit log — Ants Platform" };

const TONES: Record<string, "green" | "red" | "amber" | "blue" | "zinc"> = {
  login_failed: "red",
  locked: "red",
  reuse_detected: "red",
  signup: "green",
  login: "blue",
  created: "green",
};

function toneFor(event: string) {
  const tail = event.split(".")[1] ?? "";
  return TONES[tail] ?? "zinc";
}

export default async function PlatformAuditPage() {
  const rows = await listRecentAudit(150);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Audit log" subtitle="Most recent 150 security-relevant events across the platform." />

      <Card className="p-6">
        {rows.length === 0 ? (
          <EmptyState title="No audit events yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-400">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Event</th>
                  <th className="py-2 pr-4 font-medium">App</th>
                  <th className="py-2 pr-4 font-medium">IP</th>
                  <th className="py-2 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="whitespace-nowrap py-2.5 pr-4 text-zinc-500">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">
                      <Badge tone={toneFor(r.event)}>{r.event}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-zinc-500">{r.application_name ?? "—"}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-zinc-500">{r.ip ?? "—"}</td>
                    <td className="py-2.5 font-mono text-xs text-zinc-400">
                      {Object.keys(r.metadata ?? {}).length ? JSON.stringify(r.metadata) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
