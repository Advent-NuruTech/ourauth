import Link from "next/link";
import type { Metadata } from "next";
import { Card, Field } from "@/app/ui/kit";
import { AuthForm } from "../auth-form";
import { GoogleButton, AuthDivider, LegalConsent } from "../oauth";
import { signUpAction } from "../actions";

export const metadata: Metadata = { title: "Create account — Ants" };

export default function SignUpPage() {
  return (
    <Card className="p-6">
      <h1 className="text-xl font-semibold">Create your Ants account</h1>
      <p className="mt-1 mb-5 text-sm text-muted">
        Start building with authentication in minutes. No invite needed.
      </p>

      <GoogleButton label="Sign up with Google" />
      <AuthDivider />

      <AuthForm action={signUpAction} submitLabel="Create account" pendingLabel="Creating…">
        <Field label="Name" name="name" placeholder="Ada Lovelace" autoComplete="name" />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters, with a letter and a number."
        />
      </AuthForm>

      <LegalConsent verb="creating an account" />

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
