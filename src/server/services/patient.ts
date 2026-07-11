import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import {
  isoWeekdayInTimeZone,
  todayInTimeZone,
} from "@/lib/datetime";
import { branding } from "@/config/branding";

export type TodayExercise = {
  planItemId: string;
  title: string;
  sets: number | null;
  repetitions: number | null;
  holdSeconds: number | null;
  totalDurationSeconds: number | null;
  note: string;
  sortOrder: number;
  completedToday: boolean;
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

type Schedule = { weekdays?: number[]; times_per_week?: number };

/** Ist ein Plan-Item nach seinem Zeitfenster und Wochenplan heute fällig? */
function isDueToday(
  item: { start_date: string; end_date: string | null; schedule: unknown },
  isoToday: string,
  weekday: number
): boolean {
  if (item.start_date > isoToday) return false;
  if (item.end_date && item.end_date < isoToday) return false;
  const schedule = (item.schedule ?? {}) as Schedule;
  if (Array.isArray(schedule.weekdays)) {
    return schedule.weekdays.includes(weekday);
  }
  // Häufigkeit pro Woche: Patient wählt die Tage selbst → immer anbieten.
  return true;
}

/**
 * Daten für die Patienten-Startseite "Heute": fällige Übungen mit
 * Erledigt-Status und der nächste Termin. Alle Abfragen laufen mit
 * den Rechten des Patienten (RLS: nur eigene Daten).
 */
export async function getPatientTodayData(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: plan } = await supabase
    .from("exercise_plans")
    .select(
      `id, current_version_id,
       practices ( timezone )`
    )
    .eq("patient_profile_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const timezone = plan?.practices?.timezone ?? branding.defaultTimeZone;
  const now = new Date();
  const isoToday = todayInTimeZone(timezone, now);
  const weekday = isoWeekdayInTimeZone(now, timezone);

  let exercises: TodayExercise[] = [];
  let hasPlan = false;

  if (plan?.current_version_id) {
    hasPlan = true;
    const { data: items } = await supabase
      .from("exercise_plan_items")
      .select(
        `id, sort_order, start_date, end_date, schedule, sets, repetitions,
         hold_seconds, total_duration_seconds, note,
         exercises ( title )`
      )
      .eq("plan_version_id", plan.current_version_id)
      .order("sort_order");

    const dueItems = (items ?? []).filter((i) =>
      isDueToday(i, isoToday, weekday)
    );

    const dueIds = dueItems.map((i) => i.id);
    const { data: logs } = dueIds.length
      ? await supabase
          .from("completion_logs")
          .select("plan_item_id")
          .eq("patient_profile_id", userId)
          .eq("performed_on", isoToday)
          .in("plan_item_id", dueIds)
      : { data: [] };

    const completedIds = new Set((logs ?? []).map((l) => l.plan_item_id));

    exercises = dueItems.map((i) => ({
      planItemId: i.id,
      title: i.exercises?.title ?? "Übung",
      sets: i.sets,
      repetitions: i.repetitions,
      holdSeconds: i.hold_seconds,
      totalDurationSeconds: i.total_duration_seconds,
      note: i.note,
      sortOrder: i.sort_order,
      completedToday: completedIds.has(i.id),
    }));
  }

  const nextAppointment = await getNextAppointment(userId);

  return { exercises, hasPlan, nextAppointment, timezone };
}

/** Nächster anstehender Termin des Patienten. */
export async function getNextAppointment(
  userId: string
): Promise<NextAppointment | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
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

  if (!data) return null;

  return {
    id: data.id,
    startsAt: data.starts_at,
    endsAt: data.ends_at,
    timezone: data.timezone,
    locationName: data.location_name,
    address: data.address,
    therapistName: data.practice_members?.profiles?.full_name ?? null,
    status: data.status,
  };
}

/** Alle Termine des Patienten, kommende und vergangene getrennt. */
export async function getPatientAppointments(userId: string) {
  const supabase = await createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const base = () =>
    supabase
      .from("appointments")
      .select(
        `id, starts_at, ends_at, timezone, location_name, address, status,
         practice_members ( profiles ( full_name ) )`
      )
      .eq("patient_profile_id", userId);

  const [upcoming, past] = await Promise.all([
    base().gte("starts_at", nowIso).order("starts_at").limit(20),
    base().lt("starts_at", nowIso).order("starts_at", { ascending: false }).limit(20),
  ]);

  const toView = (rows: NonNullable<typeof upcoming.data>) =>
    rows.map((a) => ({
      id: a.id,
      startsAt: a.starts_at,
      endsAt: a.ends_at,
      timezone: a.timezone,
      locationName: a.location_name,
      address: a.address,
      status: a.status,
      therapistName: a.practice_members?.profiles?.full_name ?? null,
    }));

  return {
    upcoming: toView(upcoming.data ?? []),
    past: toView(past.data ?? []),
  };
}
