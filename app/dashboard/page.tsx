import Link from "next/link";
import type { Metadata } from "next";
import { requireDeveloper } from "@/lib/ants/dashboard/session";
import { getActiveEnvironment } from "@/lib/ants/dashboard/environment";
import { listApplications } from "@/lib/ants/apps";
import { listAppUsers } from "@/lib/ants/auth/users";
import { Card, PageHeader, Badge, EmptyState, EnvBadge } from "@/app/ui/kit";
import { CreateApp } from "./create-app";

export const metadata: Metadata = { title: "Apps — Ants" };

export default async function DashboardPage() {
  const dev = await requireDeveloper();
  const env = await getActiveEnvironment();
  const apps = await listApplications(dev.id);

  // Per-app end-user count for the active environment.
  const counts = await Promise.all(
    apps.map((a) => listAppUsers(a.id, env, { limit: 1, offset: 0 }).then((r) => r.total)),
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Applications"
        subtitle="Each app has isolated test and live user pools, keys and roles."
        action={<EnvBadge environment={env} />}
      />

      <CreateApp />

      {apps.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No applications yet"
          body="Create your first app to get test and live keys, then integrate with the SDK."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app, i) => (
            <Link key={app.id} href={`/dashboard/apps/${app.id}`} className="group">
              <Card className="h-full p-5 transition group-hover:border-[var(--border-strong)] group-hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{app.name}</h3>
                  <Badge tone="zinc">{counts[i]} users</Badge>
                </div>
                <p className="mt-3 font-mono text-xs text-muted">{app.id.slice(0, 8)}…</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span>Created {new Date(app.created_at).toLocaleDateString()}</span>
                  <span className="font-medium text-[var(--env)] capitalize">{env} →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
