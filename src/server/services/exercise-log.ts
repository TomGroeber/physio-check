import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { isoWeekdayInTimeZone, todayInTimeZone } from "@/lib/datetime";
import { calculateOccurrenceProgress, isoWeekRange } from "@/lib/occurrences";
import { normalizePlanSchedule, type PlanSchedule } from "@/lib/plan-schedule";
import type { CompletionLogInput } from "@/lib/validation/exercise-logs";
import { branding } from "@/config/branding";

const VIDEO_URL_SECONDS = 10 * 60;

export type ExerciseDetail = {
  planItemId: string;
  title: string;
  description: string;
  startingPosition: string;
  steps: string[];
  commonMistakes: string;
  equipment: string;
  sets: number | null;
  repetitions: number | null;
  holdSeconds: number | null;
  totalDurationSeconds: number | null;
  restSeconds: number | null;
  planNote: string;
  schedule: PlanSchedule;
  videoUrl: string | null;
  posterUrl: string | null;
  fallbackImageUrl: string | null;
  captionsUrl: string | null;
  plannedToday: number;
  documentedToday: number;
  completedToday: number;
  nextOccurrenceIndex: number | null;
  canDocument: boolean;
  fullyDocumentedToday: boolean;
  fullyCompletedToday: boolean;
  weeklyProgress: { target: number; documented: number; completed: number } | null;
  dueToday: boolean;
};

type OwnedPlanItem = {
  id: string;
  start_date: string;
  end_date: string | null;
  schedule: unknown;
  sets: number | null;
  repetitions: number | null;
  hold_seconds: number | null;
  total_duration_seconds: number | null;
  rest_seconds: number | null;
  note: string;
  exercise: {
    id: string;
    title: string;
    description: string;
    starting_position: string;
    steps: unknown;
    common_mistakes: string;
    equipment: string;
  };
  timezone: string;
};

/**
 * Lädt ein Plan-Item nur dann, wenn es zum AKTUELLEN aktiven Plan des
 * angemeldeten Patienten gehört. RLS begrenzt zusätzlich; diese
 * Prüfung stellt sicher, dass keine Items alter Versionen oder fremder
 * Pläne dokumentiert werden können.
 */
async function getOwnedCurrentPlanItem(
  userId: string,
  planItemId: string
): Promise<OwnedPlanItem | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("exercise_plan_items")
    .select(
      `id, start_date, end_date, schedule, sets, repetitions, hold_seconds,
       total_duration_seconds, rest_seconds, note,
       exercises ( id, title, description, starting_position, steps, common_mistakes, equipment ),
       exercise_plan_versions (
         id,
         exercise_plans!exercise_plan_versions_plan_id_fkey (
           id, patient_profile_id, status, current_version_id,
           practices ( timezone ) )
       )`
    )
    .eq("id", planItemId)
    .maybeSingle();

  const version = data?.exercise_plan_versions;
  const plan = version?.exercise_plans;
  if (
    !data ||
    !version ||
    !plan ||
    plan.patient_profile_id !== userId ||
    plan.status !== "active" ||
    plan.current_version_id !== version.id
  ) {
    return null;
  }

  return {
    id: data.id,
    start_date: data.start_date,
    end_date: data.end_date,
    schedule: data.schedule,
    sets: data.sets,
    repetitions: data.repetitions,
    hold_seconds: data.hold_seconds,
    total_duration_seconds: data.total_duration_seconds,
    rest_seconds: data.rest_seconds,
    note: data.note,
    exercise: data.exercises,
    timezone: plan.practices?.timezone ?? branding.defaultTimeZone,
  };
}

/**
 * Übungsdetail für die Patientenansicht. Das Video liegt im privaten
 * Bucket; die kurzlebige signierte URL wird erst NACH der
 * Autorisierungsprüfung (Item gehört zum eigenen aktuellen Plan) über
 * den Service-Client erzeugt.
 */
export async function getExerciseDetailForPatient(
  userId: string,
  planItemId: string
): Promise<ExerciseDetail | null> {
  const item = await getOwnedCurrentPlanItem(userId, planItemId);
  if (!item) return null;

  const now = new Date();
  const isoToday = todayInTimeZone(item.timezone, now);
  const weekday = isoWeekdayInTimeZone(now, item.timezone);
  const week = isoWeekRange(isoToday);

  const supabase = await createSupabaseServerClient();
  const [{ data: media }, { data: logs }] = await Promise.all([
    supabase
      .from("exercise_media")
      .select("kind, storage_path")
      .eq("exercise_id", item.exercise.id)
      .in("kind", ["video", "thumbnail", "fallback_image", "captions"]),
    supabase
      .from("completion_logs")
      .select("performed_on, occurrence_index, status")
      .eq("patient_profile_id", userId)
      .eq("plan_item_id", item.id)
      .gte("performed_on", week.start)
      .lte("performed_on", week.end),
  ]);
  const progress = calculateOccurrenceProgress(item, isoToday, weekday, logs ?? []);

  let videoUrl: string | null = null;
  let posterUrl: string | null = null;
  let fallbackImageUrl: string | null = null;
  let captionsUrl: string | null = null;
  const videoPath = media?.find((m) => m.kind === "video")?.storage_path;
  const posterPath = media?.find((m) => m.kind === "thumbnail")?.storage_path;
  const fallbackPath = media?.find((m) => m.kind === "fallback_image")?.storage_path;
  const captionsPath = media?.find((m) => m.kind === "captions")?.storage_path;
  const service = createSupabaseServiceClient();
  if (videoPath) {
    const { data: signed } = await service.storage
      .from("exercise-media")
      .createSignedUrl(videoPath, VIDEO_URL_SECONDS);
    videoUrl = signed?.signedUrl ?? null;
  }
  if (posterPath) {
    const { data: signedPoster } = await service.storage
      .from("exercise-media")
      .createSignedUrl(posterPath, VIDEO_URL_SECONDS);
    posterUrl = signedPoster?.signedUrl ?? null;
  }
  if (fallbackPath) {
    const { data: signedFallback } = await service.storage
      .from("exercise-media")
      .createSignedUrl(fallbackPath, VIDEO_URL_SECONDS);
    fallbackImageUrl = signedFallback?.signedUrl ?? null;
  }
  if (captionsPath) {
    const { data: signedCaptions } = await service.storage
      .from("exercise-media")
      .createSignedUrl(captionsPath, VIDEO_URL_SECONDS);
    captionsUrl = signedCaptions?.signedUrl ?? null;
  }

  return {
    planItemId: item.id,
    title: item.exercise.title,
    description: item.exercise.description,
    startingPosition: item.exercise.starting_position,
    steps: Array.isArray(item.exercise.steps)
      ? item.exercise.steps.filter((s): s is string => typeof s === "string")
      : [],
    commonMistakes: item.exercise.common_mistakes,
    equipment: item.exercise.equipment,
    sets: item.sets,
    repetitions: item.repetitions,
    holdSeconds: item.hold_seconds,
    totalDurationSeconds: item.total_duration_seconds,
    restSeconds: item.rest_seconds,
    planNote: item.note,
    schedule: normalizePlanSchedule(item.schedule),
    videoUrl,
    posterUrl,
    fallbackImageUrl,
    captionsUrl,
    plannedToday: progress.plannedToday,
    documentedToday: progress.documentedToday,
    completedToday: progress.completedToday,
    nextOccurrenceIndex: progress.nextOccurrenceIndex,
    canDocument: progress.canDocument,
    fullyDocumentedToday: progress.fullyDocumentedToday,
    fullyCompletedToday: progress.fullyCompletedToday,
    weeklyProgress: progress.weekly,
    dueToday: progress.plannedToday > 0,
  };
}

export type LogCompletionResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_due" | "already_logged" | "failed" };

/**
 * Dokumentiert eine Übung als Selbstauskunft. Serverseitige Prüfungen:
 * eigenes Item im aktuellen Plan und heute fälliger, noch freier
 * Durchgang. Die Datenbank leitet Datum und nächste Durchgangsnummer
 * atomar her und erstellt dort auch den unveränderlichen Snapshot.
 */
export async function logExerciseCompletion(
  input: CompletionLogInput
): Promise<LogCompletionResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("record_exercise_occurrence", {
    p_plan_item_id: input.planItemId,
    p_status: input.status,
    p_sets_completed: input.setsCompleted ?? null,
    p_pain_before: input.painBefore ?? null,
    p_pain_after: input.painAfter ?? null,
    p_note: input.note,
  });

  if (error) {
    if (/not_found/.test(error.message)) return { ok: false, reason: "not_found" };
    if (/not_due/.test(error.message)) return { ok: false, reason: "not_due" };
    if (/all_occurrences_logged|duplicate_occurrence|23505/.test(error.message)) {
      return { ok: false, reason: "already_logged" };
    }
    return { ok: false, reason: "failed" };
  }
  return { ok: true };
}
