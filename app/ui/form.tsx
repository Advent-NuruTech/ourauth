"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";
import { BTN_BASE, BTN_VARIANTS } from "./kit";

/** Submit button that shows a pending state while its <form> action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof BTN_VARIANTS;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${BTN_BASE} ${BTN_VARIANTS[variant]} ${className}`}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}

/** A read-only value with a click-to-copy button. */
export function CopyText({ value, mono = true }: { value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch gap-2">
      <code
        className={`flex-1 overflow-x-auto rounded-lg border border-black/15 bg-black/[0.03] px-3 py-2 text-xs dark:border-white/20 dark:bg-white/[0.04] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* clipboard unavailable */
          }
        }}
        className="shrink-0 rounded-lg border border-black/15 px-3 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/** Confirm-before-submit wrapper for destructive form actions. */
export function ConfirmSubmit({
  children,
  message,
  variant = "danger",
  pendingLabel,
}: {
  children: React.ReactNode;
  message: string;
  variant?: keyof typeof BTN_VARIANTS;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={`${BTN_BASE} ${BTN_VARIANTS[variant]}`}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </button>
  );
}
