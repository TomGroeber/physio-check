"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { getSessionContext } from "@/server/services/session";
import { auditAuthorization, getAuthorizationForPractice } from "@/server/services/authorizations";
import { getPatientDetail } from "@/server/services/practice";
import {
  adjustAuthorizationSchema,
  archiveAuthorizationSchema,
  createAuthorizationSchema,
} from "@/lib/validation/authorizations";

export type AuthorizationActionState = { error?: string; success?: string };

async function contextForPatient(patientId: string) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  const patient = await getPatientDetail(membership.practiceId, patientId);
  if (!patient) return null;
  return { session, membership };
}

export async function createAuthorizationAction(
  _state: AuthorizationActionState,
  formData: FormData
): Promise<AuthorizationActionState> {
  const parsed = createAuthorizationSchema.safeParse({
    patientId: formData.get("patientId"),
    title: formData.get("title"),
    reference: formData.get("reference"),
    prescribedSessions: formData.get("prescribedSessions"),
    issuedOn: formData.get("issuedOn"),
    validFrom: formData.get("validFrom"),
    validUntil: formData.get("validUntil"),
    prescribingDoctor: formData.get("prescribingDoctor"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await contextForPatient(parsed.data.patientId);
  if (!context) return { error: "Kein Zugriff auf diesen Patienten." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatment_authorizations")
    .insert({
      practice_id: context.membership.practiceId,
      patient_profile_id: parsed.data.patientId,
      title: parsed.data.title,
      reference: parsed.data.reference,
      prescribed_sessions: parsed.data.prescribedSessions,
      issued_on: parsed.data.issuedOn,
      valid_from: parsed.data.validFrom ?? null,
      valid_until: parsed.data.validUntil ?? null,
      prescribing_doctor: parsed.data.prescribingDoctor,
      note: parsed.data.note,
      created_by: context.membership.memberId,
    })
    .select("id")
    .single();
  if (error || !data) return { error: "Die Verordnung konnte nicht gespeichert werden." };
  await auditAuthorization(
    context.session.userId,
    context.membership.practiceId,
    data.id,
    "treatment_authorization_created"
  );
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  return { success: "Verordnung gespeichert." };
}

export async function adjustAuthorizationAction(
  _state: AuthorizationActionState,
  formData: FormData
): Promise<AuthorizationActionState> {
  const parsed = adjustAuthorizationSchema.safeParse({
    authorizationId: formData.get("authorizationId"),
    patientId: formData.get("patientId"),
    sessionDelta: formData.get("sessionDelta"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await contextForPatient(parsed.data.patientId);
  if (!context) return { error: "Kein Zugriff auf diesen Patienten." };
  const authorization = await getAuthorizationForPractice(
    context.membership.practiceId,
    parsed.data.authorizationId
  );
  if (!authorization || authorization.patient_profile_id !== parsed.data.patientId) {
    return { error: "Verordnung nicht gefunden." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("treatment_authorization_adjustments").insert({
    authorization_id: authorization.id,
    session_delta: parsed.data.sessionDelta,
    reason: parsed.data.reason,
    created_by: context.membership.memberId,
  });
  if (error) return { error: "Die Anpassung konnte nicht gespeichert werden." };
  await supabase
    .from("treatment_authorizations")
    .update({ status: "active" })
    .eq("id", authorization.id)
    .eq("status", "exhausted");
  await auditAuthorization(
    context.session.userId,
    context.membership.practiceId,
    authorization.id,
    "treatment_authorization_adjusted"
  );
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  revalidatePath("/today");
  return { success: "Sitzungsanzahl nachvollziehbar angepasst." };
}

export async function archiveAuthorizationAction(formData: FormData): Promise<void> {
  const parsed = archiveAuthorizationSchema.safeParse({
    authorizationId: formData.get("authorizationId"),
    patientId: formData.get("patientId"),
  });
  if (!parsed.success) return;
  const context = await contextForPatient(parsed.data.patientId);
  if (!context) return;
  const authorization = await getAuthorizationForPractice(
    context.membership.practiceId,
    parsed.data.authorizationId
  );
  if (!authorization || authorization.patient_profile_id !== parsed.data.patientId) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("treatment_authorizations").update({ status: "archived" }).eq("id", authorization.id);
  await auditAuthorization(
    context.session.userId,
    context.membership.practiceId,
    authorization.id,
    "treatment_authorization_archived"
  );
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
}
