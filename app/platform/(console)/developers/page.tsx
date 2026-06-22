import type { Metadata } from "next";
import { listDevelopersWithStats } from "@/lib/ants/platform";
import { Card, PageHeader, Badge, EmptyState } from "@/app/ui/kit";
import { ConfirmSubmit } from "@/app/ui/form";
import { toggleDeveloperStatusAction } from "../../actions";

export const metadata: Metadata = { title: "Developers — Ants Platform" };

export default async function PlatformDevelopersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const developers = await listDevelopersWithStats({ search });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Developers" subtitle="Every tenant on this Ants deployment." />

      <Card className="p-6">
        <form className="mb-5 flex gap-2">
          <input
            name="search"
            defaultValue={search ?? ""}
            placeholder="Search by email…"
            className="w-full max-w-xs rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm dark:border-white/20 dark:bg-black"
          />
          <button className="rounded-lg border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
            Search
          </button>
        </form>

        {developers.length === 0 ? (
          <EmptyState title="No developers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-400">
                <tr className="border-b border-black/10 dark:border-white/10">
                  <th className="py-2 pr-4 font-medium">Developer</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Apps</th>
                  <th className="py-2 pr-4 font-medium">Users</th>
                  <th className="py-2 pr-4 font-medium">Joined</th>
                  <th className="py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((d) => (
                  <tr key={d.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{d.email}</div>
                      {d.name ? <div className="text-xs text-zinc-500">{d.name}</div> : null}
                    </td>
                    <td className="py-3 pr-4">
                      {d.status === "active" ? (
                        <Badge tone="green">active</Badge>
                      ) : (
                        <Badge tone="red">suspended</Badge>
                      )}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{d.app_count}</td>
                    <td className="py-3 pr-4 tabular-nums">{d.user_count.toLocaleString()}</td>
                    <td className="py-3 pr-4 text-zinc-500">
                      {new Date(d.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <form action={toggleDeveloperStatusAction} className="inline">
                        <input type="hidden" name="developer_id" value={d.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={d.status === "active" ? "suspended" : "active"}
                        />
                        {d.status === "active" ? (
                          <ConfirmSubmit
                            message={`Suspend ${d.email}? They will be unable to sign in or use the management API.`}
                            variant="danger"
                            pendingLabel="…"
                          >
                            Suspend
                          </ConfirmSubmit>
                        ) : (
                          <ConfirmSubmit message={`Reactivate ${d.email}?`} variant="secondary" pendingLabel="…">
                            Reactivate
                          </ConfirmSubmit>
                        )}
                      </form>
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
