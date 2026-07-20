import {
  calculateOccurrenceProgress,
  isoWeekRange,
  isoWeekdayInTimeZone,
  normalizePlanSchedule,
  todayInTimeZone,
} from "@physio-check/shared";
import { branding } from "@/config/branding";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { TodayExercise } from "./today";

export type ExerciseMediaUrls = {
  video: string | null;
  poster: string | null;
  captions: string | null;
  alternate: string | null;
};

export type ExerciseDetail = TodayExercise & {
  exerciseId: string;
  restSeconds: number | null;
  equipment: string;
  /** Normalisiertes Schedule (für den Häufigkeitstext wie im Web). */
  schedule: ReturnType<typeof normalizePlanSchedule>;
  scheduleTimes: string[];
  nextOccurrenceIndex: number | null;
  media: ExerciseMediaUrls;
  timezone: string;
};

/**
 * Übungsdetail für die Dokumentation: Plan-Item mit den RLS-Rechten des
 * Patienten; signierte Medien-URLs liefert der abgesicherte
 * /api/mobile-Endpunkt (Storage ist für Patienten bewusst gesperrt).
 */
export async function getExerciseDetail(
  userId: string,
  planItemId: string
): Promise<ExerciseDetail | null> {
  const { data: item, error } = await supabase
    .from("exercise_plan_items")
    .select(
      `id, plan_version_id, exercise_id, sort_order, start_date, end_date,
       schedule, sets, repetitions, hold_seconds, total_duration_seconds,
       rest_seconds, note,
       exercises ( id, title, equipment ),
       exercise_plan_versions ( exercise_plans ( patient_profile_id, status, practices ( timezone ) ) )`
    )
    .eq("id", planItemId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!item) return null;

  const exercise = item.exercises as unknown as {
    id: string;
    title: string;
    equipment: string | null;
  } | null;
  const version = item.exercise_plan_versions as unknown as {
    exercise_plans: {
      patient_profile_id: string;
      status: string;
      practices: { timezone: string } | null;
    } | null;
  } | null;
  const timezone =
    version?.exercise_plans?.practices?.timezone ?? branding.defaultTimeZone;

  const now = new Date();
  const isoToday = todayInTimeZone(timezone, now);
  const weekday = isoWeekdayInTimeZone(now, timezone);
  const week = isoWeekRange(isoToday);

  const { data: logs, error: logsError } = await supabase
    .from("completion_logs")
    .select("plan_item_id, performed_on, occurrence_index, status")
    .eq("patient_profile_id", userId)
    .eq("plan_item_id", planItemId)
    .gte("performed_on", week.start)
    .lte("performed_on", week.end);
  if (logsError) throw new Error(logsError.message);

  const progress = calculateOccurrenceProgress(item, isoToday, weekday, logs ?? []);
  const schedule = normalizePlanSchedule(item.schedule);
  const scheduleTimes = schedule?.preferred_times ?? [];

  let media: ExerciseMediaUrls = {
    video: null,
    poster: null,
    captions: null,
    alternate: null,
  };
  try {
    media = await apiFetch<ExerciseMediaUrls>(
      `/api/mobile/exercise-media?planItemId=${encodeURIComponent(planItemId)}`
    );
  } catch {
    // Medien sind optional: ohne Server bleibt die Seite nutzbar
    // (Leerzustand); die Dokumentation hängt nicht an den Medien.
  }

  return {
    planItemId: item.id,
    exerciseId: exercise?.id ?? item.exercise_id,
    title: exercise?.title ?? "Übung",
    equipment: exercise?.equipment ?? "",
    sets: item.sets,
    repetitions: item.repetitions,
    holdSeconds: item.hold_seconds,
    totalDurationSeconds: item.total_duration_seconds,
    restSeconds: item.rest_seconds,
    note: item.note,
    sortOrder: item.sort_order,
    plannedToday: progress.plannedToday,
    documentedToday: progress.documentedToday,
    completedToday: progress.completedToday,
    canDocument: progress.canDocument,
    fullyDocumentedToday: progress.fullyDocumentedToday,
    fullyCompletedToday: progress.fullyCompletedToday,
    weeklyProgress: progress.weekly,
    schedule,
    scheduleTimes,
    nextOccurrenceIndex: progress.nextOccurrenceIndex,
    media,
    timezone,
  };
}

export type LogInput = {
  planItemId: string;
  status: "completed" | "partial" | "too_difficult" | "not_possible";
  setsCompleted: number | null;
  painBefore: number | null;
  painAfter: number | null;
  note: string;
};

/**
 * Dokumentation eines Durchgangs über die bestehende atomare RPC:
 * Sie prüft Plan, Praxisverbindung und Schedule serverseitig und
 * erstellt den Snapshot in der Datenbank – identisch zur Website.
 */
export async function recordOccurrence(input: LogInput): Promise<void> {
  const { error } = await supabase.rpc("record_exercise_occurrence", {
    p_plan_item_id: input.planItemId,
    p_status: input.status,
    p_sets_completed: input.setsCompleted,
    p_pain_before: input.painBefore,
    p_pain_after: input.painAfter,
    p_note: input.note,
  });
  if (error) throw new Error(error.message);
}
