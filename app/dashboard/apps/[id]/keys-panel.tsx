"use client";

import { useActionState } from "react";
import { Card, Badge, ErrorBanner, SectionTitle, EnvBadge } from "@/app/ui/kit";
import { SubmitButton, CopyText, ConfirmSubmit } from "@/app/ui/form";
import { rotateKeyAction, revokeKeyAction, type RotateKeyState } from "../../actions";
import type { Environment } from "@/lib/ants/apps";

type KeyRow = {
  id: string;
  type: "pk" | "sk";
  environment: Environment;
  key_prefix: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export function KeysPanel({
  appId,
  environment,
  keys,
}: {
  appId: string;
  environment: Environment;
  keys: KeyRow[];
}) {
  const [state, formAction] = useActionState<RotateKeyState, FormData>(rotateKeyAction, {});

  return (
    <Card className="p-6">
      <SectionTitle
        title="API keys"
        subtitle="Publishable keys (pk_) go in clients; secret keys (sk_) stay server-side."
        action={
          <div className="flex items-center gap-2">
            <EnvBadge environment={environment} />
            <form action={formAction}>
              <input type="hidden" name="app_id" value={appId} />
              <input type="hidden" name="type" value="pk" />
              <SubmitButton variant="secondary" pendingLabel="…">+ Publishable</SubmitButton>
            </form>
            <form action={formAction}>
              <input type="hidden" name="app_id" value={appId} />
              <input type="hidden" name="type" value="sk" />
              <SubmitButton variant="secondary" pendingLabel="…">+ Secret</SubmitButton>
            </form>
          </div>
        }
      />

      {state.error ? <div className="mt-4"><ErrorBanner message={state.error} /></div> : null}

      {state.key ? (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="mb-2 text-sm font-medium">
            New {state.key.environment} {state.key.type === "sk" ? "secret" : "publishable"} key —
            copy it now, it won’t be shown again.
          </p>
          <CopyText value={state.key.value} />
        </div>
      ) : null}

      <div className="mt-5 divide-y divide-border">
        {keys.length === 0 ? (
          <p className="py-4 text-sm text-muted">No {environment} keys yet. Generate one above.</p>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <Badge tone={k.type === "sk" ? "red" : "blue"}>{k.type}</Badge>
                <code className="font-mono text-xs">
                  {k.key_prefix}
                  {k.type === "sk" ? "…" : ""}
                </code>
                {k.revoked_at ? <Badge tone="zinc">revoked</Badge> : null}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>
                  {k.last_used_at
                    ? `used ${new Date(k.last_used_at).toLocaleDateString()}`
                    : "never used"}
                </span>
                {!k.revoked_at ? (
                  <form action={revokeKeyAction}>
                    <input type="hidden" name="app_id" value={appId} />
                    <input type="hidden" name="key_id" value={k.id} />
                    <ConfirmSubmit message="Revoke this key? Apps using it will stop working." pendingLabel="…">
                      Revoke
                    </ConfirmSubmit>
                  </form>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
