"use client";

import { useActionState } from "react";
import { ErrorBanner } from "@/app/ui/kit";
import { SubmitButton } from "@/app/ui/form";
import type { FormState } from "./actions";

/** Shared client wrapper that wires a server action to pending + error state. */
export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  children,
}: {
  action: (prev: FormState, data: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel?: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {children}
      <ErrorBanner message={state.error} />
      <SubmitButton pendingLabel={pendingLabel} className="w-full">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
