import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, Field } from "@/app/ui/kit";
import { AuthForm } from "@/app/(auth)/auth-form";
import { countPlatformAdmins } from "@/lib/ants/platform";
import { platformSetupAction } from "../../actions";

export const metadata: Metadata = { title: "Platform setup — Ants" };
export const dynamic = "force-dynamic";

export default async function PlatformSetupPage() {
  // Setup is only available before the first manager exists.
  if ((await countPlatformAdmins()) > 0) redirect("/platform/login");

  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">First-time setup</h1>
      <p className="mt-1 mb-5 text-sm text-zinc-500">
        Create the first platform manager. Authorize with your <code>ANTS_MASTER_KEY</code>.
      </p>
      <AuthForm action={platformSetupAction} submitLabel="Create manager" pendingLabel="Creating…">
        <Field label="Name" name="name" placeholder="Operator" autoComplete="name" />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters, with a letter and a number."
        />
        <Field label="Master key" name="master_key" type="password" required hint="Your ANTS_MASTER_KEY value." />
      </AuthForm>
    </Card>
  );
}
