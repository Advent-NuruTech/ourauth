"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDeveloper } from "@/lib/ants/dashboard/session";
import {
  getActiveEnvironment,
  setActiveEnvironment,
} from "@/lib/ants/dashboard/environment";
import {
  createApplication,
  createApiKey,
  createInitialKeys,
  getApplication,
  updateApplication,
  deleteApplication,
  revokeApiKey,
  buildGoogleSettings,
  type AppSettings,
  type Application,
  type Environment,
  type InitialKeys,
} from "@/lib/ants/apps";
import {
  updateDeveloperEmail,
  updateDeveloperPassword,
} from "@/lib/ants/developers";
import { validatePasswordStrength, isPasswordBreached } from "@/lib/ants/crypto/password";
import { AntsError, Errors } from "@/lib/ants/errors";
import { audit } from "@/lib/ants/audit";

function message(err: unknown): string {
  if (err instanceof AntsError) return err.message;
  console.error("[ants] dashboard action error:", err);
  return "Something went wrong. Please try again.";
}

/** Parse a textarea of newline/comma separated values into a clean list. */
function lines(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Load an application and verify the signed-in developer owns it. */
async function requireOwnedApp(
  appId: string,
): Promise<{ dev: Awaited<ReturnType<typeof requireDeveloper>>; app: Application }> {
  const dev = await requireDeveloper();
  const app = await getApplication(appId);
  if (!app) throw Errors.notFound("Application not found");
  if (app.developer_id !== dev.id) throw Errors.forbidden("Not your application");
  return { dev, app };
}

// ── Environment switching ─────────────────────────────────────────────────────

export async function switchEnvironmentAction(env: Environment): Promise<void> {
  await requireDeveloper();
  await setActiveEnvironment(env === "live" ? "live" : "test");
  revalidatePath("/dashboard", "layout");
}

// ── Applications ──────────────────────────────────────────────────────────────

export type CreateAppState = {
  error?: string;
  created?: { id: string; name: string; keys: InitialKeys };
};

export async function createAppAction(
  _prev: CreateAppState,
  formData: FormData,
): Promise<CreateAppState> {
  try {
    const dev = await requireDeveloper();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw Errors.invalidRequest("App name is required");

    const app = await createApplication(dev.id, {
      name,
      environment: "test",
      allowed_origins: lines(formData.get("allowed_origins")),
      redirect_uris: lines(formData.get("redirect_uris")),
    });
    // Dual-mode: provision both test and live key sets up front.
    const keys = await createInitialKeys(app.id);
    audit("app.created", { applicationId: app.id, metadata: { developer_id: dev.id, via: "dashboard" } });
    revalidatePath("/dashboard");
    return { created: { id: app.id, name: app.name, keys } };
  } catch (err) {
    return { error: message(err) };
  }
}

export type RotateKeyState = {
  error?: string;
  key?: { type: string; environment: Environment; value: string };
};

export async function rotateKeyAction(
  _prev: RotateKeyState,
  formData: FormData,
): Promise<RotateKeyState> {
  try {
    const appId = String(formData.get("app_id") ?? "");
    const type = formData.get("type") === "sk" ? "sk" : "pk";
    const { app } = await requireOwnedApp(appId);
    const env = await getActiveEnvironment();
    const generated = await createApiKey(app.id, type, env);
    audit("app.key_rotated", { applicationId: app.id, environment: env, metadata: { type, via: "dashboard" } });
    revalidatePath(`/dashboard/apps/${appId}`);
    return { key: { type: generated.type, environment: env, value: generated.key } };
  } catch (err) {
    return { error: message(err) };
  }
}

export async function revokeKeyAction(formData: FormData): Promise<void> {
  const appId = String(formData.get("app_id") ?? "");
  const keyId = String(formData.get("key_id") ?? "");
  const { app } = await requireOwnedApp(appId);
  await revokeApiKey(app.id, keyId);
  revalidatePath(`/dashboard/apps/${appId}`);
}

export type SettingsState = { error?: string; ok?: boolean };

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  try {
    const appId = String(formData.get("app_id") ?? "");
    const { app } = await requireOwnedApp(appId);

    let settings: AppSettings = { ...app.settings };
    settings.allowed_origins = lines(formData.get("allowed_origins"));
    settings.redirect_uris = lines(formData.get("redirect_uris"));
    settings.require_email_verification = formData.get("require_email_verification") === "on";

    const googleEnabled = formData.get("google_enabled") === "on";
    const clientId = String(formData.get("google_client_id") ?? "").trim();
    const clientSecret = String(formData.get("google_client_secret") ?? "").trim();
    settings = buildGoogleSettings(settings, {
      enabled: googleEnabled,
      client_id: clientId || undefined,
      client_secret: clientSecret || undefined,
    });

    const name = String(formData.get("name") ?? "").trim();
    await updateApplication(app.id, { name: name || undefined, settings });
    revalidatePath(`/dashboard/apps/${appId}`);
    return { ok: true };
  } catch (err) {
    return { error: message(err) };
  }
}

// ── Account (the signed-in developer) ──────────────────────────────────────────

export type AccountState = { error?: string; success?: string };

export async function updateEmailAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  try {
    const dev = await requireDeveloper();
    const newEmail = String(formData.get("email") ?? "").trim();
    const currentPassword = String(formData.get("current_password") ?? "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail)) {
      throw Errors.invalidRequest("Enter a valid email address");
    }
    const updated = await updateDeveloperEmail({
      id: dev.id,
      newEmail,
      currentPassword: currentPassword || null,
    });
    audit("developer.email_changed", { metadata: { developer_id: dev.id } });
    revalidatePath("/dashboard", "layout");
    return { success: `Email updated to ${updated.email}.` };
  } catch (err) {
    return { error: message(err) };
  }
}

export async function updatePasswordAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  try {
    const dev = await requireDeveloper();
    const currentPassword = String(formData.get("current_password") ?? "");
    const newPassword = String(formData.get("new_password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");
    if (newPassword !== confirmPassword) throw Errors.invalidRequest("New passwords do not match");
    const weak = validatePasswordStrength(newPassword);
    if (weak) throw Errors.invalidRequest(weak);
    if (await isPasswordBreached(newPassword)) {
      throw Errors.invalidRequest("This password has appeared in a data breach. Choose another.");
    }
    await updateDeveloperPassword({
      id: dev.id,
      currentPassword: currentPassword || null,
      newPassword,
    });
    audit("developer.password_changed", { metadata: { developer_id: dev.id } });
    return { success: "Password updated." };
  } catch (err) {
    return { error: message(err) };
  }
}

export async function deleteAppAction(formData: FormData): Promise<void> {
  const appId = String(formData.get("app_id") ?? "");
  const { app } = await requireOwnedApp(appId);
  await deleteApplication(app.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
