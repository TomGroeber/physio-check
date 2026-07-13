import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { dayRangeUtc, todayInTimeZone } from "@/lib/datetime";

/**
 * Datenzugriff für den Praxisbereich. Alle Abfragen laufen mit den
 * Rechten des angemeldeten Praxis-Mitglieds; RLS stellt sicher, dass
 * nur Daten der eigenen Praxis sichtbar sind.
 */

export async function getPractice(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("practices")
    .select("id, name, address_street, address_postal_code, address_city, phone, timezone")
    .eq("id", practiceId)
    .single();
  return data;
}

export async function getDashboardData(practiceId: string, timezone: string) {
  const supabase = await createSupabaseServerClient();
  const isoToday = todayInTimeZone(timezone);
  const { start, end } = dayRangeUtc(isoToday, timezone);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [appointmentsResult, cancellationsResult, linksResult] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          `id, starts_at, ends_at, timezone, status,
           patient:profiles!appointments_patient_profile_id_fkey ( full_name ),
           therapist:practice_members ( profiles ( full_name ) )`
        )
        .eq("practice_id", practiceId)
        .gte("starts_at", start.toISOString())
        .lt("starts_at", end.toISOString())
        .order("starts_at"),
      supabase
        .from("cancellation_requests")
        .select(
          `id, reason, created_at, status,
           appointments!inner ( id, starts_at, timezone, practice_id,
             patient:profiles!appointments_patient_profile_id_fkey ( full_name ) )`
        )
        .eq("status", "pending")
        .eq("appointments.practice_id", practiceId)
        .order("created_at"),
      supabase
        .from("patient_practice_links")
        .select("patient_profile_id")
        .eq("practice_id", practiceId)
        .eq("status", "active"),
    ]);

  const patientIds = (linksResult.data ?? []).map((l) => l.patient_profile_id);

  const [recentLogsResult, flaggedLogsResult] = patientIds.length
    ? await Promise.all([
        supabase
          .from("completion_logs")
          .select(
            `id, performed_at, status, pain_after,
             patient:profiles ( full_name ),
             exercise_plan_items ( exercises ( title ) )`
          )
          .in("patient_profile_id", patientIds)
          .gte("performed_at", weekAgo)
          .order("performed_at", { ascending: false })
          .limit(10),
        supabase
          .from("completion_logs")
          .select(
            `id, performed_at, status, pain_after,
             patient:profiles ( full_name ),
             exercise_plan_items ( exercises ( title ) )`
          )
          .in("patient_profile_id", patientIds)
          .gte("performed_at", weekAgo)
          .or("status.eq.too_difficult,status.eq.not_possible,pain_after.gte.7")
          .order("performed_at", { ascending: false })
          .limit(10),
      ])
    : [{ data: [] }, { data: [] }];

  return {
    todaysAppointments: appointmentsResult.data ?? [],
    pendingCancellations: cancellationsResult.data ?? [],
    recentLogs: recentLogsResult.data ?? [],
    flaggedLogs: flaggedLogsResult.data ?? [],
  };
}

export async function listPatients(practiceId: string, search: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("patient_practice_links")
    .select(
      `id, linked_at, status,
       patient:profiles!inner ( id, full_name, phone )`
    )
    .eq("practice_id", practiceId)
    .eq("status", "active")
    .order("linked_at", { ascending: false });

  if (search.trim()) {
    query = query.ilike("patient.full_name", `%${search.trim()}%`);
  }

  const { data } = await query;
  return data ?? [];
}

export async function listOpenPatientInvites(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_invites")
    .select("id, patient_display_name, expires_at, created_at")
    .eq("practice_id", practiceId)
    .is("revoked_at", null)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getOpenPatientInvite(practiceId: string, inviteId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_invites")
    .select("id, patient_display_name")
    .eq("id", inviteId)
    .eq("practice_id", practiceId)
    .is("revoked_at", null)
    .is("used_at", null)
    .maybeSingle();
  return data;
}

/**
 * Aktiver Patient der Praxis für die Detailseite. Die `patientId` aus
 * der URL genügt NIE allein: Es muss ein aktiver Link zur eigenen
 * Praxis existieren, sonst null (→ 404).
 */
export async function getPatientDetail(practiceId: string, patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_practice_links")
    .select(`id, linked_at, patient:profiles!inner ( id, full_name, phone )`)
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .eq("status", "active")
    .maybeSingle();
  return data;
}

/**
 * Dokumentierte Übungen (Selbstauskunft) eines Patienten aus Plänen
 * DIESER Praxis. Protokolle, die unter einer früheren Praxis
 * entstanden sind, bleiben dort (Mandantentrennung; zusätzlich per
 * RLS durchgesetzt).
 */
export async function getPatientCompletionLogs(
  practiceId: string,
  patientId: string,
  days: number
) {
  const supabase = await createSupabaseServerClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("completion_logs")
    .select(
      `id, performed_on, performed_at, status, sets_completed, pain_before,
       pain_after, note, prescription_snapshot,
       exercise_plan_items!inner (
         exercises ( title ),
         exercise_plan_versions!inner (
           exercise_plans!exercise_plan_versions_plan_id_fkey!inner ( practice_id )
         )
       )`
    )
    .eq("patient_profile_id", patientId)
    .eq(
      "exercise_plan_items.exercise_plan_versions.exercise_plans.practice_id",
      practiceId
    )
    .gte("performed_at", since)
    .order("performed_at", { ascending: false })
    .limit(200);
  return data ?? [];
}

/** Aktiver Übungsplan des Patienten in dieser Praxis (aktuelle Version). */
export async function getPatientCurrentPlan(practiceId: string, patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: plan } = await supabase
    .from("exercise_plans")
    .select(
      `id, title, current_version_id,
       exercise_plan_versions!exercise_plans_current_version_fk ( version_number )`
    )
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!plan?.current_version_id) return null;

  const { data: items } = await supabase
    .from("exercise_plan_items")
    .select(
      `id, sort_order, sets, repetitions, hold_seconds, total_duration_seconds,
       note, exercises ( title )`
    )
    .eq("plan_version_id", plan.current_version_id)
    .order("sort_order");

  return {
    id: plan.id,
    title: plan.title,
    versionNumber: plan.exercise_plan_versions?.version_number ?? 1,
    items: items ?? [],
  };
}

/** Nächster anstehender Termin des Patienten in dieser Praxis. */
export async function getPatientNextAppointment(
  practiceId: string,
  patientId: string
) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, ends_at, timezone, status, location_name,
       therapist:practice_members ( profiles ( full_name ) )`
    )
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .in("status", ["scheduled", "cancellation_requested"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(1)
    .maybeSingle();
  return data;
}

export async function listUpcomingAppointments(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, ends_at, timezone, status, location_name,
       patient:profiles ( full_name ),
       therapist:practice_members ( profiles ( full_name ) )`
    )
    .eq("practice_id", practiceId)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(50);
  return data ?? [];
}
