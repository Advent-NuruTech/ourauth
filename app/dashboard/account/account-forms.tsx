"use client";

import { useActionState } from "react";
import { Field, ErrorBanner, SuccessBanner } from "@/app/ui/kit";
import { SubmitButton } from "@/app/ui/form";
import { updateEmailAction, updatePasswordAction, type AccountState } from "../actions";

const EMPTY: AccountState = {};

export function EmailForm({
  currentEmail,
  hasPassword,
}: {
  currentEmail: string;
  hasPassword: boolean;
}) {
  const [state, action] = useActionState<AccountState, FormData>(updateEmailAction, EMPTY);
  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      <Field
        label="Email address"
        name="email"
        type="email"
        defaultValue={currentEmail}
        required
        autoComplete="email"
      />
      {hasPassword ? (
        <Field
          label="Current password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
          hint="Confirm it's you before changing your sign-in email."
        />
      ) : null}
      <ErrorBanner message={state.error} />
      <SuccessBanner message={state.success} />
      <div>
        <SubmitButton pendingLabel="Saving…">Update email</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action] = useActionState<AccountState, FormData>(updatePasswordAction, EMPTY);
  return (
    <form action={action} className="mt-5 flex flex-col gap-4">
      {hasPassword ? (
        <Field
          label="Current password"
          name="current_password"
          type="password"
          required
          autoComplete="current-password"
        />
      ) : null}
      <Field
        label="New password"
        name="new_password"
        type="password"
        required
        autoComplete="new-password"
        hint="At least 8 characters, including a letter and a number."
      />
      <Field
        label="Confirm new password"
        name="confirm_password"
        type="password"
        required
        autoComplete="new-password"
      />
      <ErrorBanner message={state.error} />
      <SuccessBanner message={state.success} />
      <div>
        <SubmitButton pendingLabel="Saving…">
          {hasPassword ? "Update password" : "Set password"}
        </SubmitButton>
      </div>
    </form>
  );
}
