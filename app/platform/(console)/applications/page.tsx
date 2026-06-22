import type { Metadata } from "next";
import { listAllApplications } from "@/lib/ants/platform";
import { Card, PageHeader, EmptyState } from "@/app/ui/kit";

export const metadata: Metadata = { title: "Applications — Ants Platform" };

export default async function PlatformApplicationsPage() {
  const apps = await listAllApplications();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Applications"
        subtitle={`${apps.length} application${apps.length === 1 ? "" : "s"} across all tenants.`}
      />

      <Card className="p-6">
        {apps.length === 0 ? (
          <EmptyState title="No applications yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-medium">Application</th>
                  <th className="py-2 pr-4 font-medium">Tenant</th>
                  <th className="py-2 pr-4 font-medium">Users</th>
                  <th className="py-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a) => (
                  <tr key={a.id} className="border-b border-border/60 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{a.name}</div>
                      <div className="font-mono text-xs text-muted">{a.id.slice(0, 8)}…</div>
                    </td>
                    <td className="py-3 pr-4 text-muted">{a.developer_email}</td>
                    <td className="py-3 pr-4 tabular-nums">{a.user_count.toLocaleString()}</td>
                    <td className="py-3 text-muted">{new Date(a.created_at).toLocaleDateString()}</td>
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
