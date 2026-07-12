import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";

/**
 * Interne Warteliste der Praxis. Kein Patienten-Policy – Patienten
 * sehen die Liste nicht. Offene Einträge zuerst nach Priorität,
 * dann nach Wartedauer.
 */
export async function listWaitlistEntries(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("practice_waitlist_entries")
    .select(
      `id, preferred_times, priority, note, status, created_at, resolved_at, patient_profile_id,
       patient:profiles!practice_waitlist_entries_patient_profile_id_fkey ( full_name, phone )`
    )
    .eq("practice_id", practiceId)
    .order("status")
    .order("priority", { ascending: false })
    .order("created_at");
  if (error) throw new Error("Die Warteliste konnte nicht geladen werden.");
  return data ?? [];
}

export async function countWaitingEntries(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("practice_waitlist_entries")
    .select("id", { count: "exact", head: true })
    .eq("practice_id", practiceId)
    .eq("status", "waiting");
  return count ?? 0;
}
