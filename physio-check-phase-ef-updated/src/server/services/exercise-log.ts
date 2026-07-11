import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { isoWeekdayInTimeZone, todayInTimeZone } from "@/lib/datetime";
import { isDueOn } from "@/lib/plan-schedule";
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
  videoUrl: string | null;
  posterUrl: string | null;
  completedToday: boolean;
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

async function hasLogForDay(
  userId: string,
  planItemId: string,
  isoDay: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("completion_logs")
    .select("id")
    .eq("patient_profile_id", userId)
    .eq("plan_item_id", planItemId)
    .eq("performed_on", isoDay)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
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

  const supabase = await createSupabaseServerClient();
  const { data: media } = await supabase
    .from("exercise_media")
    .select("kind, storage_path")
    .eq("exercise_id", item.exercise.id)
    .in("kind", ["video", "thumbnail"]);

  let videoUrl: string | null = null;
  let posterUrl: string | null = null;
  const videoPath = media?.find((m) => m.kind === "video")?.storage_path;
  const posterPath = media?.find((m) => m.kind === "thumbnail")?.storage_path;
  if (videoPath) {
    const service = createSupabaseServiceClient();
    const { data: signed } = await service.storage
      .from("exercise-media")
      .createSignedUrl(videoPath, VIDEO_URL_SECONDS);
    videoUrl = signed?.signedUrl ?? null;
    if (posterPath) {
      const { data: signedPoster } = await service.storage
        .from("exercise-media")
        .createSignedUrl(posterPath, VIDEO_URL_SECONDS);
      posterUrl = signedPoster?.signedUrl ?? null;
    }
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
    videoUrl,
    posterUrl,
    completedToday: await hasLogForDay(userId, item.id, isoToday),
    dueToday: isDueOn(item, isoToday, weekday),
  };
}

export type LogCompletionResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "not_due" | "already_logged" | "failed" };

/**
 * Dokumentiert eine Übung als Selbstauskunft. Serverseitige Prüfungen:
 * eigenes Item im aktuellen Plan, heute fällig, keine Doppelerfassung
 * am selben Kalendertag. `prescription_snapshot` friert die Vorgaben
 * zum Zeitpunkt der Durchführung ein. Der Insert läuft mit den Rechten
 * des Patienten (RLS als zweite Verteidigungslinie).
 */
export async function logExerciseCompletion(
  userId: string,
  input: CompletionLogInput
): Promise<LogCompletionResult> {
  const item = await getOwnedCurrentPlanItem(userId, input.planItemId);
  if (!item) return { ok: false, reason: "not_found" };

  const now = new Date();
  const isoToday = todayInTimeZone(item.timezone, now);
  const weekday = isoWeekdayInTimeZone(now, item.timezone);
  if (!isDueOn(item, isoToday, weekday)) {
    return { ok: false, reason: "not_due" };
  }

  if (await hasLogForDay(userId, item.id, isoToday)) {
    return { ok: false, reason: "already_logged" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("completion_logs").insert({
    patient_profile_id: userId,
    plan_item_id: item.id,
    performed_on: isoToday,
    status: input.status,
    sets_completed: input.setsCompleted ?? null,
    pain_before: input.painBefore ?? null,
    pain_after: input.painAfter ?? null,
    note: input.note,
    prescription_snapshot: {
      exercise_id: item.exercise.id,
      exercise_title: item.exercise.title,
      sets: item.sets,
      repetitions: item.repetitions,
      hold_seconds: item.hold_seconds,
      total_duration_seconds: item.total_duration_seconds,
      rest_seconds: item.rest_seconds,
      schedule: item.schedule as never,
      note: item.note,
    },
  });

  if (error) return { ok: false, reason: "failed" };
  return { ok: true };
}
