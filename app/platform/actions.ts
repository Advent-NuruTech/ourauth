"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  countPlatformAdmins,
  createPlatformAdmin,
  authenticatePlatformAdmin,
  issuePlatformToken,
  setDeveloperStatus,
} from "@/lib/ants/platform";
import {
  setPlatformSession,
  clearPlatformSession,
  requirePlatformAdmin,
} from "@/lib/ants/dashboard/session";
import { validatePasswordStrength } from "@/lib/ants/crypto/password";
import { getConfig } from "@/lib/ants/config";
import { safeEqual } from "@/lib/ants/crypto/tokens";
import { AntsError } from "@/lib/ants/errors";

export type FormState = { error?: string };

function message(err: unknown): string {
  if (err instanceof AntsError) return err.message;
  console.error("[ants] platform action error:", err);
  return "Something went wrong. Please try again.";
}

/**
 * Bootstrap the first platform manager. Gated by ANTS_MASTER_KEY and only
 * permitted while no managers exist yet — afterwards, new managers must be
 * provisioned by an existing one (or directly in the database).
 */
export async function platformSetupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    if ((await countPlatformAdmins()) > 0) {
      throw new AntsError(403, "forbidden", "Setup is already complete. Please sign in.");
    }
    const masterKey = String(formData.get("master_key") ?? "");
    if (!safeEqual(masterKey, getConfig().ANTS_MASTER_KEY)) {
      throw new AntsError(403, "forbidden", "Invalid master key");
    }
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const weak = validatePasswordStrength(password);
    if (weak) throw new AntsError(400, "invalid_request", weak);

    const admin = await createPlatformAdmin({ email, password, name: name || undefined });
    const token = await issuePlatformToken(admin.id);
    await setPlatformSession(token);
  } catch (err) {
    return { error: message(err) };
  }
  redirect("/platform");
}

export async function platformLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const admin = await authenticatePlatformAdmin(email, password);
    const token = await issuePlatformToken(admin.id);
    await setPlatformSession(token);
  } catch (err) {
    return { error: message(err) };
  }
  redirect("/platform");
}

export async function platformLogoutAction(): Promise<void> {
  await clearPlatformSession();
  redirect("/platform/login");
}

export async function toggleDeveloperStatusAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin();
  const developerId = String(formData.get("developer_id") ?? "");
  const next = formData.get("next") === "suspended" ? "suspended" : "active";
  await setDeveloperStatus(developerId, next);
  revalidatePath("/platform/developers");
}
