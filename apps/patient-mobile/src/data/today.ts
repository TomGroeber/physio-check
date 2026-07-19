import {
  calculateOccurrenceProgress,
  isDueOn,
  isoWeekRange,
  isoWeekdayInTimeZone,
  todayInTimeZone,
} from "@physio-check/shared";
import { branding } from "@/config/branding";
import { supabase } from "@/lib/supabase";

export type TodayExercise = {
  planItemId: string;
  title: string;
  sets: number | null;
  repetitions: number | null;
  holdSeconds: number | null;
  totalDurationSeconds: number | null;
  note: string;
  sortOrder: number;
  plannedToday: number;
  documentedToday: number;
  completedToday: number;
  canDocument: boolean;
  fullyDocumentedToday: boolean;
  fullyCompletedToday: boolean;
  weeklyProgress: { target: number; documented: number; completed: number } | null;
};

export type NextAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  locationName: string;
  address: string;
  therapistName: string | null;
  status: string;
};

export type TodayData = {
  exercises: TodayExercise[];
  hasPlan: boolean;
  nextAppointment: NextAppointment | null;
  timezone: string;
};

/**
 * Spiegel der Website-Logik (src/server/services/patient.ts): alle
 * Abfragen laufen mit den RLS-Rechten des Patienten – die App bekommt
 * ausschließlich eigene Daten, dieselbe Regel wie im Web.
 */
export async function getTodayData(userId: string): Promise<TodayData> {
  const { data: plan, error: planError } = await supabase
    .from("exercise_plans")
    .select("id, current_version_id, practices ( timezone )")
    .eq("patient_profile_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (planError) throw new Error(planError.message);

  const practices = plan?.practices as unknown as { timezone: string } | null | undefined;
  const timezone = practices?.timezone ?? branding.defaultTimeZone;
  const now = new Date();
  const isoToday = todayInTimeZone(timezone, now);
  const weekday = isoWeekdayInTimeZone(now, timezone);

  let exercises: TodayExercise[] = [];
  let hasPlan = false;

  if (plan?.current_version_id) {
    hasPlan = true;
    const { data: items, error: itemsError } = await supabase
      .from("exercise_plan_items")
      .select(
        `id, sort_order, start_date, end_date, schedule, sets, repetitions,
         hold_seconds, total_duration_seconds, note,
         exercises ( title )`
      )
      .eq("plan_version_id", plan.current_version_id)
      .order("sort_order");
    if (itemsError) throw new Error(itemsError.message);

    const dueItems = (items ?? []).filter((item) =>
      isDueOn(item, isoToday, weekday)
    );
    const dueIds = dueItems.map((item) => item.id);
    const week = isoWeekRange(isoToday);
    const { data: logs, error: logsError } = dueIds.length
      ? await supabase
          .from("completion_logs")
          .select("plan_item_id, performed_on, occurrence_index, status")
          .eq("patient_profile_id", userId)
          .gte("performed_on", week.start)
          .lte("performed_on", week.end)
          .in("plan_item_id", dueIds)
      : { data: [], error: null };
    if (logsError) throw new Error(logsError.message);

    exercises = dueItems
      .map((item) => {
        const exercise = item.exercises as unknown as { title: string } | null;
        const progress = calculateOccurrenceProgress(
          item,
          isoToday,
          weekday,
          (logs ?? []).filter((log) => log.plan_item_id === item.id)
        );
        return {
          planItemId: item.id,
          title: exercise?.title ?? "Übung",
          sets: item.sets,
          repetitions: item.repetitions,
          holdSeconds: item.hold_seconds,
          totalDurationSeconds: item.total_duration_seconds,
          note: item.note,
          sortOrder: item.sort_order,
          plannedToday: progress.plannedToday,
          documentedToday: progress.documentedToday,
          completedToday: progress.completedToday,
          canDocument: progress.canDocument,
          fullyDocumentedToday: progress.fullyDocumentedToday,
          fullyCompletedToday: progress.fullyCompletedToday,
          weeklyProgress: progress.weekly,
        };
      })
      .filter((exercise) => exercise.plannedToday > 0);
  }

  const nextAppointment = await getNextAppointment(userId);
  return { exercises, hasPlan, nextAppointment, timezone };
}

export async function getNextAppointment(
  userId: string
): Promise<NextAppointment | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, starts_at, ends_at, timezone, location_name, address, status,
       practice_members ( profiles ( full_name ) )`
    )
    .eq("patient_profile_id", userId)
    .in("status", ["scheduled", "cancellation_requested"])
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const member = data.practice_members as unknown as {
    profiles: { full_name: string } | null;
  } | null;
  return {
    id: data.id,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    timezone: data.timezone,
    locationName: data.location_name,
    address: data.address,
    therapistName: member?.profiles?.full_name ?? null,
    status: data.status,
  };
}
