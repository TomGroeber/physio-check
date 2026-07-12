import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";

/**
 * Markierte Patienten einer Praxis. Interne Organisation – Patienten
 * haben keine Leserechte auf die Tabelle (kein Patienten-Policy).
 */
export async function listPinnedPatients(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("pinned_patients")
    .select(
      `patient_profile_id, note, created_at,
       patient:profiles!pinned_patients_patient_profile_id_fkey ( full_name )`
    )
    .eq("practice_id", practiceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Markierte Patienten konnten nicht geladen werden.");
  return data ?? [];
}

export async function getPinnedPatient(practiceId: string, patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("pinned_patients")
    .select("id, note, created_at")
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .maybeSingle();
  return data;
}
