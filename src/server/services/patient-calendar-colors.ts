import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import type { CalendarColor } from "@/lib/calendar-colors";

/**
 * Kalenderfarben pro Patient und Praxis (D-057): interne
 * Organisationsdaten wie Markierungen – Patienten haben keinerlei
 * Lese- oder Schreibzugriff (keine Patienten-Policy). Alle Zugriffe
 * laufen mit den Rechten des angemeldeten Praxismitglieds; RLS begrenzt
 * auf die eigene Praxis.
 */

/** Farbzuordnung der Praxis als Map patient_profile_id → Farbe. */
export async function getPatientCalendarColors(
  practiceId: string
): Promise<Record<string, CalendarColor>> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_calendar_colors")
    .select("patient_profile_id, color")
    .eq("practice_id", practiceId);
  return Object.fromEntries(
    (data ?? []).map((row) => [row.patient_profile_id, row.color as CalendarColor])
  );
}

/** Farbe eines einzelnen Patienten (für die Detailseite). */
export async function getPatientCalendarColor(
  practiceId: string,
  patientId: string
): Promise<CalendarColor | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_calendar_colors")
    .select("color")
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .maybeSingle();
  return (data?.color as CalendarColor | undefined) ?? null;
}

export async function setPatientCalendarColor(
  practiceId: string,
  patientId: string,
  color: CalendarColor
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("patient_calendar_colors")
    .upsert(
      { practice_id: practiceId, patient_profile_id: patientId, color },
      { onConflict: "practice_id,patient_profile_id" }
    );
  if (error) throw new Error(`Kalenderfarbe konnte nicht gespeichert werden: ${error.message}`);
}

export async function removePatientCalendarColor(
  practiceId: string,
  patientId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("patient_calendar_colors")
    .delete()
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId);
  if (error) throw new Error(`Kalenderfarbe konnte nicht entfernt werden: ${error.message}`);
}
