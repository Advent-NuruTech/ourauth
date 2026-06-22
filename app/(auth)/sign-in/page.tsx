import Link from "next/link";
import type { Metadata } from "next";
import { Card, Field, ErrorBanner } from "@/app/ui/kit";
import { AuthForm } from "../auth-form";
import { GoogleButton, AuthDivider, LegalConsent } from "../oauth";
import { signInAction } from "../actions";

export const metadata: Metadata = { title: "Sign in — Ants" };

const OAUTH_ERRORS: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_failed: "Could not complete Google sign-in. Please try again.",
  oauth_unavailable: "Google sign-in is temporarily unavailable.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ suspended?: string; error?: string }>;
}) {
  const { suspended, error } = await searchParams;
  const oauthError = error ? OAUTH_ERRORS[error] : undefined;
  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">Sign in to Ants</h1>
      <p className="mt-1 mb-5 text-sm text-muted">Manage your apps, keys, and users.</p>
      {suspended ? (
        <div className="mb-4">
          <ErrorBanner message="Your account is suspended. Contact the platform team." />
        </div>
      ) : null}
      {oauthError ? (
        <div className="mb-4">
          <ErrorBanner message={oauthError} />
        </div>
      ) : null}

      <GoogleButton label="Continue with Google" />
      <AuthDivider />

      <AuthForm action={signInAction} submitLabel="Sign in" pendingLabel="Signing in…">
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      </AuthForm>

      <LegalConsent verb="continuing" />

      <p className="mt-4 text-center text-sm text-muted">
        No account?{" "}
        <Link href="/sign-up" className="font-medium underline underline-offset-4">
          Create one
        </Link>
      </p>
    </Card>
  );
}
