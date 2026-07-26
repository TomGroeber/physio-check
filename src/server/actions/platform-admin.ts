"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getPlatformConfig,
  getPracticeDetailForAdmin,
  setPracticeLifecycle,
  setPracticeMemberStatus,
  updatePlatformConfig,
  updatePlatformFeatureFlags,
  updatePracticeProfileAsPlatformAdmin,
} from "@/server/services/platform-admin";
import { assertPlatformAdmin } from "@/server/services/platform-admin-auth";
import {
  createStaffInviteAsPlatformAdmin,
  hashInviteToken,
  renewStaffInvite,
} from "@/server/services/staff-invites";
import { createSupabaseServerClient } from "@/server/db/server-client";
import {
  FEATURE_FLAG_KEYS,
  featureFlagsSchema,
  practiceLifecycleSchema,
  practiceOnboardingSchema,
  practiceProfileSchema,
  practiceSettingsSchema,
  staffInviteSchema,
} from "@/lib/validation/platform-admin";

export type OnboardingState = {
  error?: string;
  practiceId?: string;
  inviteLink?: string;
  adminEmail?: string;
};

/** Phase C: Praxis + erste Admin-Einladung in einem atomaren Schritt. */
export async function onboardPracticeAction(
  _previousState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  await assertPlatformAdmin();

  const parsed = practiceOnboardingSchema.safeParse({
    name: formData.get("name"),
    addressStreet: formData.get("addressStreet"),
    addressPostalCode: formData.get("addressPostalCode"),
    addressCity: formData.get("addressCity"),
    country: formData.get("country"),
    timezone: formData.get("timezone"),
    locale: formData.get("locale"),
    phone: formData.get("phone"),
    supportEmail: formData.get("supportEmail"),
    website: formData.get("website"),
    status: formData.get("status"),
    trialEndsAt: formData.get("trialEndsAt"),
    adminName: formData.get("adminName"),
    adminEmail: formData.get("adminEmail"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Bitte prüfen Sie Ihre Eingaben." };
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  const tokenHash = hashInviteToken(token);
  const invitesExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const trialEndsAt = parsed.data.trialEndsAt
    ? new Date(`${parsed.data.trialEndsAt}T00:00:00.000Z`).toISOString()
    : undefined;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_practice_with_admin_invite", {
    p_name: parsed.data.name,
    p_address_street: parsed.data.addressStreet,
    p_address_postal_code: parsed.data.addressPostalCode,
    p_address_city: parsed.data.addressCity,
    p_phone: parsed.data.phone,
    p_timezone: parsed.data.timezone,
    p_support_email: parsed.data.supportEmail,
    p_support_url: "",
    p_status: parsed.data.status,
    p_admin_email: parsed.data.adminEmail,
    p_admin_token_hash: tokenHash,
    p_invite_expires_at: invitesExpiresAt,
    p_trial_ends_at: trialEndsAt,
  });

  if (error || !data?.[0]) {
    return { error: "Die Praxis konnte nicht angelegt werden. Bitte versuchen Sie es erneut." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  revalidatePath("/admin/practices");
  revalidatePath("/admin");
  return {
    practiceId: data[0].out_practice_id,
    inviteLink: `${appUrl}/staff-invite/${token}`,
    adminEmail: parsed.data.adminEmail,
  };
}

export type SimpleActionState = { error?: string; success?: boolean };

export async function updatePracticeProfileAsPlatformAdminAction(
  practiceId: string,
  _previousState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  await assertPlatformAdmin();
  const parsed = practiceProfileSchema.safeParse({
    name: formData.get("name"),
    addressStreet: formData.get("addressStreet"),
    addressPostalCode: formData.get("addressPostalCode"),
    addressCity: formData.get("addressCity"),
    phone: formData.get("phone"),
    timezone: formData.get("timezone"),
    supportEmail: formData.get("supportEmail"),
    supportUrl: formData.get("supportUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const ok = await updatePracticeProfileAsPlatformAdmin(practiceId, parsed.data);
  if (!ok) return { error: "Die Änderung konnte nicht gespeichert werden." };
  revalidatePath(`/admin/practices/${practiceId}`);
  return { success: true };
}

export async function setPracticeLifecycleAction(
  practiceId: string,
  _previousState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  await assertPlatformAdmin();
  const parsed = practiceLifecycleSchema.safeParse({
    status: formData.get("status"),
    trialEndsAt: formData.get("trialEndsAt"),
    internalNote: formData.get("internalNote"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const trialEndsAt = parsed.data.trialEndsAt
    ? new Date(`${parsed.data.trialEndsAt}T00:00:00.000Z`).toISOString()
    : null;

  const ok = await setPracticeLifecycle(practiceId, {
    status: parsed.data.status,
    trialEndsAt,
    internalNote: parsed.data.internalNote,
  });
  if (!ok) return { error: "Der Status konnte nicht geändert werden." };
  revalidatePath(`/admin/practices/${practiceId}`);
  revalidatePath("/admin/practices");
  revalidatePath("/admin");
  return { success: true };
}

export async function updatePracticeSettingsAsPlatformAdminAction(
  practiceId: string,
  _previousState: SimpleActionState,
  formData: FormData
): Promise<SimpleActionState> {
  await assertPlatformAdmin();
  const detail = await getPracticeDetailForAdmin(practiceId);
  const parsed = practiceSettingsSchema.safeParse({
    ...detail?.settings,
    defaultAppointmentDurationMinutes: Number(formData.get("defaultAppointmentDurationMinutes")),
    cancellationNoticeHours: formData.get("cancellationNoticeHours"),
    cancellationNoticeText: formData.get("cancellationNoticeText"),
    lowSessionsThreshold: formData.get("lowSessionsThreshold"),
    patientSafetyText: formData.get("patientSafetyText"),
    accentColor: formData.get("accentColor"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_practice_settings", {
    p_practice_id: practiceId,
    p_settings: parsed.data,
  });
  if (error) return { error: "Die Einstellungen konnten nicht gespeichert werden." };
  revalidatePath(`/admin/practices/${practiceId}`);
  return { success: true };
}

export async function setPracticeMemberStatusAction(formData: FormData): Promise<void> {
  const memberId = formData.get("memberId");
  const role = formData.get("role");
  const isActive = formData.get("isActive") === "true";
  const practiceId = formData.get("practiceId");
  if (typeof memberId !== "string" || (role !== "admin" && role !== "therapist")) return;

  await assertPlatformAdmin();
  await setPracticeMemberStatus(memberId, role, isActive);
  if (typeof practiceId === "string") revalidatePath(`/admin/practices/${practiceId}`);
}

export type StaffInviteActionState = { error?: string; inviteLink?: string; email?: string };

/** Ausnahmefall: Plattformadmin lädt für eine bestehende Praxis nach (z. B. Praxis ohne Admin). */
export async function createStaffInviteAsPlatformAdminAction(
  practiceId: string,
  _previousState: StaffInviteActionState,
  formData: FormData
): Promise<StaffInviteActionState> {
  await assertPlatformAdmin();
  const parsed = staffInviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };

  const result = await createStaffInviteAsPlatformAdmin(practiceId, parsed.data);
  if ("error" in result) return { error: "Die Einladung konnte nicht erstellt werden." };
  revalidatePath(`/admin/practices/${practiceId}`);
  return { inviteLink: result.link, email: result.email };
}

export async function renewStaffInviteAsPlatformAdminAction(
  practiceId: string,
  _previousState: StaffInviteActionState,
  formData: FormData
): Promise<StaffInviteActionState> {
  await assertPlatformAdmin();
  const inviteId = formData.get("inviteId");
  if (typeof inviteId !== "string") return { error: "Ungültige Anfrage." };
  const result = await renewStaffInvite(practiceId, inviteId);
  if ("error" in result) return { error: "Die Einladung konnte nicht erneuert werden." };
  revalidatePath(`/admin/practices/${practiceId}`);
  return { inviteLink: result.link, email: result.email };
}

export async function revokeStaffInviteAsPlatformAdminAction(formData: FormData): Promise<void> {
  const inviteId = formData.get("inviteId");
  const practiceId = formData.get("practiceId");
  if (typeof inviteId !== "string" || typeof practiceId !== "string") return;

  await assertPlatformAdmin();
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("staff_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("practice_id", practiceId)
    .is("accepted_at", null);
  revalidatePath(`/admin/practices/${practiceId}`);
}

export type PlatformConfigActionState = { error?: string; success?: boolean };

export async function updatePlatformConfigAction(
  _previousState: PlatformConfigActionState,
  formData: FormData
): Promise<PlatformConfigActionState> {
  await assertPlatformAdmin();
  const parsed = {
    productName: String(formData.get("productName") ?? ""),
    supportEmail: String(formData.get("supportEmail") ?? ""),
    supportUrl: String(formData.get("supportUrl") ?? ""),
    privacyUrl: String(formData.get("privacyUrl") ?? ""),
    imprintUrl: String(formData.get("imprintUrl") ?? ""),
    maintenanceActive: formData.get("maintenanceActive") === "on",
    maintenanceMessage: String(formData.get("maintenanceMessage") ?? ""),
    defaultNewPracticeTimezone: String(formData.get("defaultNewPracticeTimezone") ?? "Europe/Luxembourg"),
    defaultNewPracticeLocale: "de" as const,
    maxUploadMb: Number(formData.get("maxUploadMb") ?? 5),
  };

  const ok = await updatePlatformConfig(parsed);
  if (!ok) return { error: "Die Einstellungen konnten nicht gespeichert werden." };
  revalidatePath("/admin/config");
  return { success: true };
}

export async function updatePlatformFeatureFlagAction(formData: FormData): Promise<void> {
  await assertPlatformAdmin();
  const config = await getPlatformConfig();
  const key = formData.get("flagKey");
  const enabled = formData.get("enabled") === "true";
  const defaultForNewPractices = formData.get("defaultForNewPractices") === "true";
  if (typeof key !== "string" || !FEATURE_FLAG_KEYS.includes(key as never)) return;

  const nextFlags = featureFlagsSchema.parse({
    ...config.featureFlags,
    [key]: { enabled, defaultForNewPractices },
  });
  await updatePlatformFeatureFlags(nextFlags);
  revalidatePath("/admin/config");
}

export async function redirectAfterOnboarding(practiceId: string): Promise<void> {
  redirect(`/admin/practices/${practiceId}`);
}
