import Link from "next/link";
import type { Metadata } from "next";
import { Card, Field } from "@/app/ui/kit";
import { AuthForm } from "@/app/(auth)/auth-form";
import { countPlatformAdmins } from "@/lib/ants/platform";
import { platformLoginAction } from "../../actions";

export const metadata: Metadata = { title: "Platform sign in — Ants" };
export const dynamic = "force-dynamic";

export default async function PlatformLoginPage() {
  const needsSetup = (await countPlatformAdmins()) === 0;

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">Platform console</h1>
      <p className="mt-1 mb-5 text-sm text-zinc-500">
        Operator access — manage all tenants and applications.
      </p>
      {needsSetup ? (
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm">
          No platform manager exists yet.{" "}
          <Link href="/platform/setup" className="font-medium underline underline-offset-4">
            Run first-time setup →
          </Link>
        </div>
      ) : null}
      <AuthForm action={platformLoginAction} submitLabel="Sign in" pendingLabel="Signing in…">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      </AuthForm>
    </Card>
  );
}
