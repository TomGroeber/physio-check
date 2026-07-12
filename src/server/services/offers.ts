import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";

/**
 * Terminangebote: Die Praxis bietet ein Zeitfenster an, der Patient
 * nimmt an oder lehnt ab. Angebote werden nie gelöscht, nur mit Status
 * abgeschlossen (accepted/declined/withdrawn).
 */
export async function listPracticeOffers(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointment_offers")
    .select(
      `id, starts_at, ends_at, timezone, location_name, status, created_at, responded_at,
       patient_profile_id,
       patient:profiles!appointment_offers_patient_profile_id_fkey ( full_name ),
       therapist:practice_members!appointment_offers_therapist_member_id_fkey ( profiles ( full_name ) )`
    )
    .eq("practice_id", practiceId)
    .order("starts_at");
  if (error) throw new Error("Terminangebote konnten nicht geladen werden.");
  return data ?? [];
}

export async function listPatientOffers(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointment_offers")
    .select(
      `id, starts_at, ends_at, timezone, location_name, status,
       therapist:practice_members!appointment_offers_therapist_member_id_fkey ( profiles ( full_name ) )`
    )
    .eq("patient_profile_id", userId)
    .eq("status", "offered")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at");
  if (error) throw new Error("Terminangebote konnten nicht geladen werden.");
  return data ?? [];
}

/**
 * Frei gewordene zukünftige Zeitfenster: stornierte Termine, deren
 * Zeitraum noch bevorsteht – Kandidaten für ein Angebot an die
 * Warteliste.
 */
export async function listFreedSlots(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, ends_at, timezone, location_name, therapist_member_id,
       therapist:practice_members ( profiles ( full_name ) )`
    )
    .eq("practice_id", practiceId)
    .eq("status", "cancelled")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(10);
  if (error) throw new Error("Freie Zeitfenster konnten nicht geladen werden.");
  return data ?? [];
}
