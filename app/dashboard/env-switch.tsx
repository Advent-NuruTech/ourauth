"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { switchEnvironmentAction } from "./actions";

type Env = "live" | "test";

/**
 * Global Test/Live switcher. A segmented control whose active half is filled
 * with the environment accent (amber for test, emerald for live), so the
 * current mode is unmistakable. Switching to live asks for a quick confirm to
 * prevent accidental production changes.
 */
export function EnvSwitch({ current }: { current: Env }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useState<Env>(current);

  function choose(env: Env) {
    if (env === optimistic || pending) return;
    if (env === "live" && !confirm("Switch to LIVE mode? You'll be acting on real production data.")) {
      return;
    }
    setOptimistic(env);
    startTransition(async () => {
      await switchEnvironmentAction(env);
      router.refresh();
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Environment"
      className={`relative inline-flex items-center rounded-full border border-border bg-surface p-0.5 text-xs font-medium transition ${
        pending ? "opacity-70" : ""
      }`}
    >
      {(["test", "live"] as Env[]).map((env) => {
        const active = optimistic === env;
        const color = env === "live" ? "bg-emerald-500" : "bg-amber-500";
        return (
          <button
            key={env}
            role="radio"
            aria-checked={active}
            onClick={() => choose(env)}
            className={`relative z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 capitalize transition ${
              active ? "text-white" : "text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`size-1.5 rounded-full transition ${
                active ? "bg-white" : env === "live" ? "bg-emerald-500/60" : "bg-amber-500/60"
              }`}
            />
            {env}
            {active && (
              <span
                aria-hidden
                className={`absolute inset-0 -z-10 rounded-full ${color} shadow-sm`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
