import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { listPracticeExercises } from "@/server/services/exercises";

export type SearchHit = { id: string; label: string; href: string };

const RESULT_LIMIT = 5;

export async function searchPatients(practiceId: string, query: string): Promise<SearchHit[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_practice_links")
    .select("patient:profiles!inner ( id, full_name )")
    .eq("practice_id", practiceId)
    .eq("status", "active")
    .ilike("patient.full_name", `%${query}%`)
    .limit(RESULT_LIMIT);

  return (data ?? []).map((row) => ({
    id: row.patient.id,
    label: row.patient.full_name,
    href: `/practice/patients/${row.patient.id}`,
  }));
}

export async function searchExercises(practiceId: string, query: string): Promise<SearchHit[]> {
  const rows = await listPracticeExercises(practiceId, {
    search: query,
    category: "",
    equipment: "",
    includeArchived: false,
  });
  return rows.slice(0, RESULT_LIMIT).map((row) => ({
    id: row.id,
    label: row.title,
    href: `/practice/exercises/${row.id}`,
  }));
}
