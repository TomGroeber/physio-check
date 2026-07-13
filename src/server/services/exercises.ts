import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import type { ExerciseFieldsInput } from "@/lib/validation/exercises";

/**
 * Übungsbibliothek der Praxis. Alle Abfragen laufen mit den Rechten des
 * angemeldeten Mitglieds; die practice_id stammt IMMER aus der server-
 * seitig verifizierten Mitgliedschaft, nie vom Client. Übungen werden
 * nie hart gelöscht (keine Delete-Policy) – nur deaktiviert/archiviert.
 */

export type ExerciseFilters = {
  search: string;
  category: string;
  equipment: string;
  includeArchived: boolean;
};

export async function listPracticeExercises(practiceId: string, filters: ExerciseFilters) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("exercises")
    .select(
      `id, title, description, category, equipment, is_active, archived_at,
       default_dosage_type, created_at,
       exercise_media ( id, kind )`
    )
    .eq("practice_id", practiceId)
    .order("title");
  if (!filters.includeArchived) query = query.is("archived_at", null);
  if (filters.search.trim()) query = query.ilike("title", `%${filters.search.trim()}%`);
  if (filters.category.trim()) query = query.ilike("category", `%${filters.category.trim()}%`);
  if (filters.equipment.trim()) query = query.ilike("equipment", `%${filters.equipment.trim()}%`);
  const { data, error } = await query;
  if (error) throw new Error("Die Übungen konnten nicht geladen werden.");
  return data ?? [];
}

/** Vorhandene Kategorien der Praxis für den Filter (distinct, ohne leere). */
export async function listExerciseCategories(practiceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exercises")
    .select("category")
    .eq("practice_id", practiceId)
    .neq("category", "");
  return [...new Set((data ?? []).map((row) => row.category))].sort();
}

export async function getPracticeExercise(practiceId: string, exerciseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exercises")
    .select(
      `id, title, description, starting_position, steps, common_mistakes, equipment,
       category, default_dosage_type, default_sets, default_repetitions,
       default_hold_seconds, default_total_duration_seconds, default_rest_seconds,
       is_active, archived_at,
       exercise_media ( id, kind, mime_type, size_bytes, created_at )`
    )
    .eq("id", exerciseId)
    .eq("practice_id", practiceId)
    .maybeSingle();
  return data;
}

function fieldsToRow(input: ExerciseFieldsInput) {
  return {
    title: input.title,
    description: input.description,
    starting_position: input.startingPosition,
    steps: input.stepsText,
    common_mistakes: input.commonMistakes,
    equipment: input.equipment,
    category: input.category,
    default_dosage_type: input.defaultDosageType,
    default_sets: input.defaultSets ?? null,
    default_repetitions: input.defaultRepetitions ?? null,
    default_hold_seconds: input.defaultHoldSeconds ?? null,
    default_total_duration_seconds: input.defaultTotalDurationSeconds ?? null,
    default_rest_seconds: input.defaultRestSeconds ?? null,
  };
}

export async function createExercise(
  practiceId: string,
  memberId: string,
  input: ExerciseFieldsInput
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .insert({ ...fieldsToRow(input), practice_id: practiceId, created_by: memberId })
    .select("id")
    .single();
  if (error || !data) throw new Error("Die Übung konnte nicht angelegt werden.");
  return data.id;
}

export async function updateExercise(
  practiceId: string,
  exerciseId: string,
  input: ExerciseFieldsInput
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .update(fieldsToRow(input))
    .eq("id", exerciseId)
    .eq("practice_id", practiceId)
    .select("id");
  if (error || !data?.length) throw new Error("Die Übung konnte nicht gespeichert werden.");
}

/** Kopie inkl. aller Standardwerte; Medien werden bewusst NICHT kopiert. */
export async function duplicateExercise(
  practiceId: string,
  memberId: string,
  exerciseId: string
) {
  const source = await getPracticeExercise(practiceId, exerciseId);
  if (!source) throw new Error("Übung nicht gefunden.");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      practice_id: practiceId,
      created_by: memberId,
      title: `${source.title} (Kopie)`.slice(0, 200),
      description: source.description,
      starting_position: source.starting_position,
      steps: source.steps ?? [],
      common_mistakes: source.common_mistakes,
      equipment: source.equipment,
      category: source.category,
      default_dosage_type: source.default_dosage_type,
      default_sets: source.default_sets,
      default_repetitions: source.default_repetitions,
      default_hold_seconds: source.default_hold_seconds,
      default_total_duration_seconds: source.default_total_duration_seconds,
      default_rest_seconds: source.default_rest_seconds,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error("Die Übung konnte nicht dupliziert werden.");
  return data.id;
}

export async function setExerciseActive(practiceId: string, exerciseId: string, isActive: boolean) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .update({ is_active: isActive })
    .eq("id", exerciseId)
    .eq("practice_id", practiceId)
    .select("id");
  if (error || !data?.length) throw new Error("Der Status konnte nicht geändert werden.");
}

export async function setExerciseArchived(
  practiceId: string,
  exerciseId: string,
  archived: boolean
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("exercises")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", exerciseId)
    .eq("practice_id", practiceId)
    .select("id");
  if (error || !data?.length) throw new Error("Die Archivierung konnte nicht geändert werden.");
}

export async function auditExercise(
  actorId: string,
  practiceId: string,
  exerciseId: string,
  eventType: string
) {
  const service = createSupabaseServiceClient();
  await service.from("audit_events").insert({
    actor_profile_id: actorId,
    practice_id: practiceId,
    event_type: eventType,
    entity_type: "exercise",
    entity_id: exerciseId,
    metadata: {},
  });
}
