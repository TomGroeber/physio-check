import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";

export async function auditAuthorization(
  actorId: string,
  practiceId: string,
  authorizationId: string,
  eventType: string
) {
  const service = createSupabaseServiceClient();
  await service.from("audit_events").insert({
    actor_profile_id: actorId,
    practice_id: practiceId,
    event_type: eventType,
    entity_type: "treatment_authorization",
    entity_id: authorizationId,
    metadata: {},
  });
}

export async function getAuthorizationRemaining(authorizationId: string): Promise<number> {
  return remainingFor(authorizationId);
}

async function remainingFor(authorizationId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("authorization_remaining", {
    p_authorization_id: authorizationId,
  });
  if (error) throw new Error("Der Sitzungsstand konnte nicht berechnet werden.");
  return data;
}

async function adjustedTotalFor(authorizationId: string): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("authorization_adjusted_total", {
    p_authorization_id: authorizationId,
  });
  if (error) throw new Error("Die verordnete Gesamtzahl konnte nicht berechnet werden.");
  return data;
}

export async function listPatientAuthorizations(practiceId: string, patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("treatment_authorizations")
    .select(
      `id, title, reference, prescribed_sessions, issued_on, valid_from, valid_until,
       status, prescribing_doctor, note, created_at,
       treatment_authorization_adjustments ( id, session_delta, reason, created_at ),
       appointment_authorization_usages (
         id, sessions_used, created_at, reversed_at, appointment_id,
         appointments ( starts_at, timezone )
       )`
    )
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .order("issued_on", { ascending: false });
  if (error) throw new Error("Verordnungen konnten nicht geladen werden.");

  return Promise.all(
    (data ?? []).map(async (authorization) => ({
      ...authorization,
      remaining: await remainingFor(authorization.id),
      adjustedTotal:
        authorization.prescribed_sessions +
        authorization.treatment_authorization_adjustments.reduce(
          (sum, adjustment) => sum + adjustment.session_delta,
          0
        ),
    }))
  );
}

/**
 * Maßgebliche Verordnung des Patienten – dieselbe Auswahlregel, die auch
 * die automatische Anrechnung beim Terminabschluss verwendet (DB-Funktion
 * primary_authorization_for_patient). Anzeige und Anrechnung können sich
 * dadurch nicht widersprechen.
 */
export async function getPatientAuthorizationSummary(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: primaryId } = await supabase.rpc("primary_authorization_for_patient", {
    p_patient_id: userId,
  });
  if (!primaryId) return null;
  const { data } = await supabase
    .from("treatment_authorizations")
    .select("id, title, prescribed_sessions, valid_from, valid_until, status")
    .eq("id", primaryId)
    .maybeSingle();
  if (!data) return null;
  const [remaining, adjustedTotal] = await Promise.all([
    remainingFor(data.id),
    adjustedTotalFor(data.id),
  ]);
  return { ...data, remaining, adjustedTotal };
}

/**
 * Verbleibende Einheiten der maßgeblichen Verordnung aus Praxissicht
 * (für die Warnung beim Terminabschluss). null = keine Verordnung.
 */
export async function getPatientUnitStatus(patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: primaryId } = await supabase.rpc("primary_authorization_for_patient", {
    p_patient_id: patientId,
  });
  if (!primaryId) return null;
  return { authorizationId: primaryId, remaining: await remainingFor(primaryId) };
}

export async function getAuthorizationForPractice(practiceId: string, authorizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("treatment_authorizations")
    .select("id, patient_profile_id, practice_id, status")
    .eq("id", authorizationId)
    .eq("practice_id", practiceId)
    .maybeSingle();
  return data;
}
