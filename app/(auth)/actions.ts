"use server";

import { redirect } from "next/navigation";
import {
  authenticateDeveloper,
  createDeveloper,
  issueDeveloperToken,
} from "@/lib/ants/developers";
import { setDeveloperSession, clearDeveloperSession } from "@/lib/ants/dashboard/session";
import { validatePasswordStrength, isPasswordBreached } from "@/lib/ants/crypto/password";
import { AntsError } from "@/lib/ants/errors";
import { audit } from "@/lib/ants/audit";

export type FormState = { error?: string };

function message(err: unknown): string {
  if (err instanceof AntsError) return err.message;
  console.error("[ants] dashboard action error:", err);
  return "Something went wrong. Please try again.";
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    const dev = await authenticateDeveloper(email, password);
    const token = await issueDeveloperToken(dev.id);
    await setDeveloperSession(token);
    audit("developer.login", { metadata: { developer_id: dev.id, via: "dashboard" } });
  } catch (err) {
    return { error: message(err) };
  }
  redirect("/dashboard");
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  try {
    const weak = validatePasswordStrength(password);
    if (weak) throw new AntsError(400, "invalid_request", weak);
    if (await isPasswordBreached(password)) {
      throw new AntsError(400, "invalid_request", "This password has appeared in a data breach. Choose another.");
    }
    const dev = await createDeveloper({ email, password, name: name || undefined });
    const token = await issueDeveloperToken(dev.id);
    await setDeveloperSession(token);
    audit("developer.signup", { metadata: { developer_id: dev.id, via: "dashboard" } });
  } catch (err) {
    return { error: message(err) };
  }
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await clearDeveloperSession();
  redirect("/sign-in");
}
