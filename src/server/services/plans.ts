import "server-only";

import type { Json } from "@/server/db/database.types";
import { normalizePlanSchedule, type PlanSchedule } from "@/lib/plan-schedule";
import type { PublishPlanInput } from "@/lib/validation/plans";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { de } from "@/messages/de";

export type PlanEditorExercise = {
  id: string;
  title: string;
  category: string;
  defaultSets: number | null;
  defaultRepetitions: number | null;
  defaultHoldSeconds: number | null;
  defaultTotalDurationSeconds: number | null;
  defaultRestSeconds: number | null;
};

export type PlanEditorItem = {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  startDate: string;
  endDate: string | null;
  schedule: PlanSchedule;
  sets: number | null;
  repetitions: number | null;
  holdSeconds: number | null;
  totalDurationSeconds: number | null;
  restSeconds: number | null;
  note: string;
};

export type PlanEditorVersion = {
  id: string;
  versionNumber: number;
  changeNote: string;
  createdAt: string;
};

export type PlanEditorData = {
  exercises: PlanEditorExercise[];
  plan: {
    id: string;
    title: string;
    currentVersionId: string;
    versionNumber: number;
    items: PlanEditorItem[];
  } | null;
  versions: PlanEditorVersion[];
};

/** Loads only this practice's active, non-archived library and active plan. */
export async function getPlanEditorData(
  practiceId: string,
  patientId: string
): Promise<PlanEditorData> {
  const supabase = await createSupabaseServerClient();
  const [{ data: exerciseRows, error: exerciseError }, { data: planRow, error: planError }] =
    await Promise.all([
      supabase
        .from("exercises")
        .select(
          `id, title, category, default_sets, default_repetitions,
           default_hold_seconds, default_total_duration_seconds, default_rest_seconds`
        )
        .eq("practice_id", practiceId)
        .eq("is_active", true)
        .is("archived_at", null)
        .order("title"),
      supabase
        .from("exercise_plans")
        .select("id, title, current_version_id")
        .eq("practice_id", practiceId)
        .eq("patient_profile_id", patientId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

  if (exerciseError || planError) throw new Error(de.practice.plans.loadError);

  const exercises = (exerciseRows ?? []).map((exercise) => ({
    id: exercise.id,
    title: exercise.title,
    category: exercise.category,
    defaultSets: exercise.default_sets,
    defaultRepetitions: exercise.default_repetitions,
    defaultHoldSeconds: exercise.default_hold_seconds,
    defaultTotalDurationSeconds: exercise.default_total_duration_seconds,
    defaultRestSeconds: exercise.default_rest_seconds,
  }));

  if (!planRow?.current_version_id) return { exercises, plan: null, versions: [] };

  const [{ data: versionRows, error: versionsError }, { data: itemRows, error: itemsError }] =
    await Promise.all([
      supabase
        .from("exercise_plan_versions")
        .select("id, version_number, change_note, created_at")
        .eq("plan_id", planRow.id)
        .order("version_number", { ascending: false }),
      supabase
        .from("exercise_plan_items")
        .select(
          `id, exercise_id, start_date, end_date, schedule, sets, repetitions,
           hold_seconds, total_duration_seconds, rest_seconds, note,
           exercises ( title )`
        )
        .eq("plan_version_id", planRow.current_version_id)
        .order("sort_order"),
    ]);
  if (versionsError || itemsError) throw new Error(de.practice.plans.loadError);

  const versions = (versionRows ?? []).map((version) => ({
    id: version.id,
    versionNumber: version.version_number,
    changeNote: version.change_note,
    createdAt: version.created_at,
  }));
  const currentVersion = versions.find((version) => version.id === planRow.current_version_id);

  return {
    exercises,
    versions,
    plan: {
      id: planRow.id,
      title: planRow.title,
      currentVersionId: planRow.current_version_id,
      versionNumber: currentVersion?.versionNumber ?? 1,
      items: (itemRows ?? []).map((item) => ({
        id: item.id,
        exerciseId: item.exercise_id,
        exerciseTitle: item.exercises?.title ?? de.practice.plans.unknownExercise,
        startDate: item.start_date,
        endDate: item.end_date,
        schedule: normalizePlanSchedule(item.schedule),
        sets: item.sets,
        repetitions: item.repetitions,
        holdSeconds: item.hold_seconds,
        totalDurationSeconds: item.total_duration_seconds,
        restSeconds: item.rest_seconds,
        note: item.note,
      })),
    },
  };
}

export async function publishExercisePlan(
  practiceId: string,
  input: PublishPlanInput
): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const items: Json = input.items.map((item) => ({
    exercise_id: item.exerciseId,
    start_date: item.startDate,
    end_date: item.endDate,
    schedule: item.schedule,
    sets: item.sets,
    repetitions: item.repetitions,
    hold_seconds: item.holdSeconds,
    total_duration_seconds: item.totalDurationSeconds,
    rest_seconds: item.restSeconds,
    note: item.note,
  }));
  const { data, error } = await supabase.rpc("publish_exercise_plan", {
    p_practice_id: practiceId,
    p_patient_id: input.patientId,
    p_title: input.title,
    p_change_note: input.changeNote,
    p_items: items,
    p_notification_title: de.notifications.planPublishedTitle,
    p_notification_body: de.notifications.planPublishedBody,
  });
  if (error || !data) throw new Error(de.practice.plans.publishError);
  return data;
}

export async function archiveExercisePlan(
  practiceId: string,
  patientId: string,
  planId: string
) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("archive_exercise_plan", {
    p_practice_id: practiceId,
    p_patient_id: patientId,
    p_plan_id: planId,
    p_notification_title: de.notifications.planArchivedTitle,
    p_notification_body: de.notifications.planArchivedBody,
  });
  if (error) throw new Error(de.practice.plans.archiveError);
}
