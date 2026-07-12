import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";

/**
 * Internes Kurzprofil pro Patient und Praxis. Liegt in einer eigenen
 * Tabelle ohne Patienten-Policy – Patienten können es nicht lesen.
 */
export async function getPatientInternalProfile(practiceId: string, patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_internal_profiles")
    .select("content, updated_at")
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .maybeSingle();
  return data;
}
