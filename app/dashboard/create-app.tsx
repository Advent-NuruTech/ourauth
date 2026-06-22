"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Card, Field, Textarea, ErrorBanner, EnvBadge, BTN_BASE, BTN_VARIANTS } from "@/app/ui/kit";
import { SubmitButton, CopyText } from "@/app/ui/form";
import { createAppAction, type CreateAppState } from "./actions";

export function CreateApp() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<CreateAppState, FormData>(createAppAction, {});

  if (state.created) {
    const c = state.created;
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">“{c.name}” created 🎉</h2>
        <p className="mt-1 text-sm text-muted">
          Copy your secret keys now — they’re shown only once and can’t be retrieved later. Each
          environment has its own key pair.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {(["test", "live"] as const).map((env) => (
            <div key={env} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <EnvBadge environment={env} />
              <div>
                <div className="mb-1 text-xs font-medium text-muted">Publishable key</div>
                <CopyText value={c.keys[env].publishable_key} />
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-muted">Secret key</div>
                <CopyText value={c.keys[env].secret_key} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Link href={`/dashboard/apps/${c.id}`} className={`${BTN_BASE} ${BTN_VARIANTS.primary}`}>
            Open app →
          </Link>
        </div>
      </Card>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={`${BTN_BASE} ${BTN_VARIANTS.primary} self-start`}>
        + New application
      </button>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Create an application</h2>
      <p className="mt-1 text-sm text-muted">
        Your app starts with both test and live key sets. Roles and permissions are added later
        via the API or SDK.
      </p>
      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <Field label="Name" name="name" placeholder="My App" required />
        <Textarea
          label="Allowed origins"
          name="allowed_origins"
          rows={2}
          placeholder="https://app.example.com"
          hint="One per line. Leave empty to allow all (not recommended)."
        />
        <ErrorBanner message={state.error} />
        <div className="flex gap-3">
          <SubmitButton pendingLabel="Creating…">Create app</SubmitButton>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`${BTN_BASE} ${BTN_VARIANTS.secondary}`}
          >
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
