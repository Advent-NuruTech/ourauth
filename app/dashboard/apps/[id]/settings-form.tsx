"use client";

import { useActionState } from "react";
import { Card, Field, ErrorBanner } from "@/app/ui/kit";
import { SubmitButton } from "@/app/ui/form";
import { updateSettingsAction, type SettingsState } from "../../actions";
import type { AppSettings } from "@/lib/ants/apps";

export function SettingsForm({
  appId,
  name,
  settings,
}: {
  appId: string;
  name: string;
  settings: AppSettings;
}) {
  const [state, formAction] = useActionState<SettingsState, FormData>(updateSettingsAction, {});

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold">Settings</h2>
      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <input type="hidden" name="app_id" value={appId} />
        <Field label="App name" name="name" defaultValue={name} required />

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Allowed origins</span>
          <textarea
            name="allowed_origins"
            rows={3}
            defaultValue={(settings.allowed_origins ?? []).join("\n")}
            placeholder="https://app.example.com"
            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-mono dark:border-white/20 dark:bg-black"
          />
          <span className="text-xs text-zinc-400">One per line. CORS + origin allow-list for the auth API.</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Redirect URIs</span>
          <textarea
            name="redirect_uris"
            rows={2}
            defaultValue={(settings.redirect_uris ?? []).join("\n")}
            placeholder="https://app.example.com/auth/callback"
            className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm font-mono dark:border-white/20 dark:bg-black"
          />
        </label>

        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="require_email_verification"
            defaultChecked={settings.require_email_verification ?? true}
            className="size-4"
          />
          <span className="text-sm">Require email verification before login</span>
        </label>

        <fieldset className="rounded-lg border border-black/10 p-4 dark:border-white/15">
          <legend className="px-1 text-sm font-medium">Google sign-in</legend>
          <label className="mt-1 flex items-center gap-2.5">
            <input
              type="checkbox"
              name="google_enabled"
              defaultChecked={settings.google?.enabled ?? false}
              className="size-4"
            />
            <span className="text-sm">Enable “Continue with Google” for this app</span>
          </label>
          <div className="mt-4 flex flex-col gap-4">
            <Field
              label="Google client ID"
              name="google_client_id"
              defaultValue={settings.google?.client_id ?? ""}
              placeholder="Leave blank to use platform default"
            />
            <Field
              label="Google client secret"
              name="google_client_secret"
              type="password"
              placeholder={settings.google?.client_secret_enc ? "•••••••• (set — leave blank to keep)" : "Optional"}
              hint="Stored encrypted at rest. Leave blank to keep the existing value."
            />
          </div>
        </fieldset>

        <ErrorBanner message={state.error} />
        <div className="flex items-center gap-3">
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
          {state.ok ? <span className="text-sm text-emerald-600 dark:text-emerald-400">Saved ✓</span> : null}
        </div>
      </form>
    </Card>
  );
}
