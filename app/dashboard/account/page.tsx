import Link from "next/link";
import type { Metadata } from "next";
import { requireDeveloper } from "@/lib/ants/dashboard/session";
import { developerHasPassword } from "@/lib/ants/developers";
import { Card, PageHeader, SectionTitle } from "@/app/ui/kit";
import { EmailForm, PasswordForm } from "./account-forms";

export const metadata: Metadata = { title: "Account — Ants" };

export default async function AccountPage() {
  const dev = await requireDeveloper();
  const hasPassword = await developerHasPassword(dev.id);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/dashboard" className="text-sm text-muted hover:text-foreground">
          ← Back to apps
        </Link>
        <div className="mt-3">
          <PageHeader
            title="Account settings"
            subtitle="Manage the email and password you use to sign in to Ants."
          />
        </div>
      </div>

      <Card className="p-6">
        <SectionTitle
          title="Email address"
          subtitle="Used to sign in and to receive account notifications."
        />
        <EmailForm currentEmail={dev.email} hasPassword={hasPassword} />
      </Card>

      <Card className="p-6">
        <SectionTitle
          title="Password"
          subtitle={
            hasPassword
              ? "Change the password you use to sign in."
              : "Add a password so you can sign in without Google."
          }
        />
        <PasswordForm hasPassword={hasPassword} />
      </Card>
    </div>
  );
}
