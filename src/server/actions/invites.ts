"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { getSessionContext } from "@/server/services/session";
import {
  clearInviteSession,
  ensureInviteClientCookie,
  getPendingInvite,
  inspectInviteCode,
  redeemPendingInvite,
  storeInviteSession,
} from "@/server/services/invites";
import {
  formatInviteCode,
  generateInviteCode,
  hashInviteCode,
} from "@/lib/invite-code";
import { inviteCodeSchema, patientInviteSchema } from "@/lib/validation/invites";
import { de } from "@/messages/de";

export type InviteEntryState = { error?: string };
export type CreatePatientInviteState = {
  error?: string;
  code?: string;
  inviteLink?: string;
  patientDisplayName?: string;
};

/** Gemeinsame Codeprüfung; gibt bei Erfolg null zurück und setzt die Sitzung. */
async function checkCodeAndStoreSession(
  formData: FormData
): Promise<InviteEntryState | null> {
  const parsed = inviteCodeSchema.safeParse(formData.get("code"));
  await ensureInviteClientCookie();

  if (!parsed.success) return { error: de.connect.errorInvalid };
  const inspection = await inspectInviteCode(parsed.data);
  if (inspection.status === "rate_limited") {
    return { error: de.connect.errorTooManyAttempts };
  }
  if (inspection.status === "invalid") {
    return { error: de.connect.errorInvalid };
  }

  await storeInviteSession(inspection.token);
  return null;
}

/** Öffentliche Codeeingabe (Startseite/Einladungslink). */
export async function startInviteAction(
  _previousState: InviteEntryState,
  formData: FormData
): Promise<InviteEntryState> {
  const failure = await checkCodeAndStoreSession(formData);
  if (failure) return failure;
  redirect("/invite/continue");
}

/** Codeeingabe eines angemeldeten, (noch) unverbundenen Kontos. */
export async function connectCodeAction(
  _previousState: InviteEntryState,
  formData: FormData
): Promise<InviteEntryState> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const failure = await checkCodeAndStoreSession(formData);
  if (failure) return failure;
  redirect("/connect");
}

/** Verwirf die geprüfte Einladung, z. B. um einen anderen Code einzugeben. */
export async function discardPendingInviteAction(): Promise<void> {
  await clearInviteSession();
  redirect("/connect");
}

export async function acceptInviteAction(): Promise<void> {
  const session = await getSessionContext();
  if (!session) redirect("/login?invite=1");

  const success = await redeemPendingInvite();
  if (!success) {
    await clearInviteSession();
    redirect("/connect?error=expired");
  }

  await clearInviteSession();
  revalidatePath("/", "layout");
  redirect("/today?connected=1");
}

export async function createPatientInviteAction(
  _previousState: CreatePatientInviteState,
  formData: FormData
): Promise<CreatePatientInviteState> {
  const replaceValue = formData.get("replaceInviteId");
  const parsed = patientInviteSchema.safeParse({
    patientDisplayName: formData.get("patientDisplayName"),
    replaceInviteId:
      typeof replaceValue === "string" && replaceValue ? replaceValue : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? de.common.error };
  }

  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return { error: de.errors.forbiddenBody };

  const code = generateInviteCode();
  const codeHash = hashInviteCode(code);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const supabase = await createSupabaseServerClient();

  let inviteId: string | null = null;
  if (parsed.data.replaceInviteId) {
    const { data, error } = await supabase.rpc("renew_patient_invite", {
      p_invite_id: parsed.data.replaceInviteId,
      p_code_hash: codeHash,
      p_expires_at: expiresAt,
    });
    if (error) return { error: de.practice.patients.inviteCreateError };
    inviteId = data;
  } else {
    const { data, error } = await supabase
      .from("patient_invites")
      .insert({
        practice_id: membership.practiceId,
        created_by: membership.memberId,
        patient_display_name: parsed.data.patientDisplayName,
        code_hash: codeHash,
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (error || !data) return { error: de.practice.patients.inviteCreateError };
    inviteId = data.id;

    const service = createSupabaseServiceClient();
    await service.from("audit_events").insert({
      actor_profile_id: session.userId,
      practice_id: membership.practiceId,
      event_type: "patient_invite_created",
      entity_type: "patient_invite",
      entity_id: inviteId,
      metadata: {},
    });
  }

  revalidatePath("/practice/patients");
  const formattedCode = formatInviteCode(code);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    code: formattedCode,
    inviteLink: `${appUrl}/invite?code=${formattedCode}`,
    patientDisplayName: parsed.data.patientDisplayName,
  };
}

export async function revokePatientInviteAction(formData: FormData): Promise<void> {
  const inviteId = formData.get("inviteId");
  if (typeof inviteId !== "string") return;

  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!membership) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("patient_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("practice_id", membership.practiceId)
    .is("used_at", null);

  revalidatePath("/practice/patients");
}

export async function pendingInviteExists(): Promise<boolean> {
  return Boolean(await getPendingInvite());
}

