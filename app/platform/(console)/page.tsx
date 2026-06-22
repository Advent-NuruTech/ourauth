import Link from "next/link";
import type { Metadata } from "next";
import { getPlatformStats, listAllApplications } from "@/lib/ants/platform";
import { Card, PageHeader, StatCard, LinkButton } from "@/app/ui/kit";

export const metadata: Metadata = { title: "Platform overview — Ants" };

export default async function PlatformOverviewPage() {
  const [stats, apps] = await Promise.all([getPlatformStats(), listAllApplications()]);
  const recentApps = apps.slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Platform overview"
        subtitle="Health of the whole Ants deployment across every tenant."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Developers"
          value={stats.developers}
          hint={`${stats.developers_last_7d} new this week · ${stats.developers_suspended} suspended`}
        />
        <StatCard label="Applications" value={stats.applications} />
        <StatCard
          label="End users"
          value={stats.end_users.toLocaleString()}
          hint={`${stats.end_users_last_7d} new this week`}
        />
        <StatCard label="Active sessions" value={stats.active_sessions.toLocaleString()} />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent applications</h2>
          <LinkButton href="/platform/applications" variant="secondary">
            View all
          </LinkButton>
        </div>
        {recentApps.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No applications have been created yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-medium">App</th>
                  <th className="py-2 pr-4 font-medium">Tenant</th>
                  <th className="py-2 font-medium">Users</th>
                </tr>
              </thead>
              <tbody>
                {recentApps.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{a.name}</td>
                    <td className="py-2.5 pr-4 text-muted">{a.developer_email}</td>
                    <td className="py-2.5 tabular-nums">{a.user_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-sm text-muted">
        Managing tenants?{" "}
        <Link href="/platform/developers" className="font-medium underline underline-offset-4">
          Go to developers →
        </Link>
      </p>
    </div>
  );
}
