import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDeveloper } from "@/lib/ants/dashboard/session";
import { getActiveEnvironment } from "@/lib/ants/dashboard/environment";
import { getApplication, listApiKeys, type Environment } from "@/lib/ants/apps";
import { listAppUsers, publicUser } from "@/lib/ants/auth/users";
import { listRoles, listPermissions } from "@/lib/ants/rbac";
import { Card, PageHeader, Badge, EmptyState, EnvBadge, SectionTitle, Mono } from "@/app/ui/kit";
import { ConfirmSubmit } from "@/app/ui/form";
import { KeysPanel } from "./keys-panel";
import { SettingsForm } from "./settings-form";
import { deleteAppAction } from "../../actions";

const PAGE_SIZE = 25;

export default async function AppDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { id } = await params;
  const { search, page } = await searchParams;
  const dev = await requireDeveloper();
  const env = await getActiveEnvironment();
  const app = await getApplication(id);
  if (!app || app.developer_id !== dev.id) notFound();

  const pageNum = Math.max(Number(page) || 1, 1);
  const offset = (pageNum - 1) * PAGE_SIZE;

  const keyRows = await listApiKeys(id, env);
  const keys = keyRows.map((k) => ({
    id: k.id as string,
    type: k.type as "pk" | "sk",
    environment: k.environment as Environment,
    key_prefix: k.key_prefix as string,
    last_used_at: (k.last_used_at as string) ?? null,
    revoked_at: (k.revoked_at as string) ?? null,
    created_at: k.created_at as string,
  }));

  const { users, total } = await listAppUsers(id, env, { search, limit: PAGE_SIZE, offset });
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const roles = await listRoles(id, env);
  const permissions = await listPermissions(id, env);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
          ← All apps
        </Link>
        <div className="mt-3">
          <PageHeader
            title={app.name}
            subtitle={app.id}
            action={<EnvBadge environment={env} />}
          />
        </div>
      </div>

      <KeysPanel appId={app.id} environment={env} keys={keys} />

      {/* End users */}
      <Card className="p-6">
        <SectionTitle
          title="End users"
          subtitle={`${total} ${total === 1 ? "user" : "users"} in the ${env} pool.`}
          action={
            <form className="flex gap-2">
              <input
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search email…"
                className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
              />
              <button className="rounded-xl border border-border px-3 py-1.5 text-sm font-medium transition hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                Search
              </button>
            </form>
          }
        />

        {users.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No users found"
              body={`Users appear here once they sign up through your app in ${env} mode.`}
            />
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-border">
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Verified</th>
                  <th className="py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map(publicUser).map((u) => (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4">{u.email}</td>
                    <td className="py-2.5 pr-4 text-muted">{u.full_name ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      {u.email_verified ? <Badge tone="green">yes</Badge> : <Badge tone="zinc">no</Badge>}
                    </td>
                    <td className="py-2.5 text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-muted">
            <span>
              Page {pageNum} of {totalPages}
            </span>
            <div className="flex gap-2">
              {pageNum > 1 ? (
                <Link
                  href={`/dashboard/apps/${app.id}?page=${pageNum - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className="rounded-xl border border-border px-3 py-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  Previous
                </Link>
              ) : null}
              {pageNum < totalPages ? (
                <Link
                  href={`/dashboard/apps/${app.id}?page=${pageNum + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
                  className="rounded-xl border border-border px-3 py-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Dynamic roles & permissions (managed via API/SDK) */}
      <Card className="p-6">
        <SectionTitle
          title="Roles & permissions"
          subtitle={`Fully dynamic, defined by your app — scoped to the ${env} environment.`}
          action={<Badge tone="indigo">{roles.length} roles · {permissions.length} permissions</Badge>}
        />

        {roles.length === 0 && permissions.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon="🧩"
              title="No roles or permissions yet"
              body="Create them programmatically with the management API or the server SDK (AntsManagement). Ants ships no built-in roles — your app defines them all."
            />
          </div>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-muted">Roles</h3>
              <div className="mt-2 flex flex-col gap-2">
                {roles.length === 0 ? (
                  <p className="text-sm text-muted">No roles defined.</p>
                ) : (
                  roles.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{r.name}</span>
                        <Mono>{r.key}</Mono>
                        {r.is_default ? <Badge tone="blue">default</Badge> : null}
                      </div>
                      {r.description ? (
                        <p className="mt-1 text-xs text-muted">{r.description}</p>
                      ) : null}
                      {r.permissions.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.permissions.map((p) => (
                            <Mono key={p.id}>{p.key}</Mono>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted">No permissions attached.</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted">Permission catalog</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {permissions.length === 0 ? (
                  <p className="text-sm text-muted">No permissions defined.</p>
                ) : (
                  permissions.map((p) => (
                    <span
                      key={p.id}
                      title={p.description ?? undefined}
                      className="rounded-md bg-black/[0.05] px-2 py-1 font-mono text-xs dark:bg-white/[0.08]"
                    >
                      {p.key}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <SettingsForm appId={app.id} name={app.name} settings={app.settings} />

      {/* Danger zone */}
      <Card className="border-red-500/30 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        <p className="mt-1 text-sm text-muted">
          Deleting an app permanently removes its keys, users, roles and sessions across both
          environments. This cannot be undone.
        </p>
        <form action={deleteAppAction} className="mt-4">
          <input type="hidden" name="app_id" value={app.id} />
          <ConfirmSubmit
            message={`Delete “${app.name}” and all of its data? This cannot be undone.`}
            pendingLabel="Deleting…"
          >
            Delete application
          </ConfirmSubmit>
        </form>
      </Card>
    </div>
  );
}
