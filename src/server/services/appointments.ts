import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";

export type AppointmentFilters = {
  therapistId?: string;
  patientId?: string;
  status?: "scheduled" | "cancellation_requested" | "cancelled" | "completed";
};

export async function getAppointmentOptions(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const [practiceResult, patientsResult, therapistsResult] = await Promise.all([
    supabase
      .from("practices")
      .select("id, name, address_street, address_postal_code, address_city, timezone")
      .eq("id", practiceId)
      .single(),
    supabase
      .from("patient_practice_links")
      .select("patient:profiles!inner ( id, full_name )")
      .eq("practice_id", practiceId)
      .eq("status", "active"),
    supabase
      .from("practice_members")
      .select("id, profile_id, calendar_color, profiles ( full_name )")
      .eq("practice_id", practiceId)
      .eq("is_active", true)
      .order("created_at"),
  ]);

  return {
    practice: practiceResult.data,
    patients: (patientsResult.data ?? []).map((row) => row.patient),
    therapists: therapistsResult.data ?? [],
  };
}

export async function listCalendarAppointments(
  practiceId: string,
  start: string,
  endExclusive: string,
  filters: AppointmentFilters = {}
) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("appointments")
    .select(
      `id, starts_at, ends_at, timezone, status, location_name,
       cancellation_reason, cancelled_at, completed_at,
       patient:profiles!appointments_patient_profile_id_fkey ( id, full_name ),
       therapist:practice_members!appointments_therapist_member_id_fkey (
         id, calendar_color, profiles ( full_name )
       )`
    )
    .eq("practice_id", practiceId)
    .gte("starts_at", start)
    .lt("starts_at", endExclusive)
    .order("starts_at");

  if (filters.patientId) query = query.eq("patient_profile_id", filters.patientId);
  if (filters.therapistId) query = query.eq("therapist_member_id", filters.therapistId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw new Error(`Kalender konnte nicht geladen werden: ${error.message}`);
  return data ?? [];
}

export async function getPracticeAppointment(practiceId: string, appointmentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      `id, patient_profile_id, therapist_member_id, starts_at, ends_at, timezone,
       location_name, address, note, status, cancellation_reason, cancelled_at,
       completed_at,
       patient:profiles!appointments_patient_profile_id_fkey ( id, full_name ),
       therapist:practice_members!appointments_therapist_member_id_fkey (
         id, calendar_color, profiles ( full_name )
       )`
    )
    .eq("id", appointmentId)
    .eq("practice_id", practiceId)
    .maybeSingle();
  return data;
}

export async function notifyProfile(
  recipientProfileId: string,
  type: string,
  title: string,
  body: string,
  reference: Record<string, string>
) {
  const service = createSupabaseServiceClient();
  const { error } = await service.from("notifications").insert({
    recipient_profile_id: recipientProfileId,
    type,
    title,
    body,
    reference,
  });
  if (error) throw new Error(`Benachrichtigung konnte nicht erstellt werden: ${error.message}`);
}

export async function auditAppointment(
  actorProfileId: string,
  practiceId: string,
  appointmentId: string,
  eventType: string
) {
  const service = createSupabaseServiceClient();
  await service.from("audit_events").insert({
    actor_profile_id: actorProfileId,
    practice_id: practiceId,
    event_type: eventType,
    entity_type: "appointment",
    entity_id: appointmentId,
    metadata: {},
  });
}
