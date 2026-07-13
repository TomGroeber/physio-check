import {
  isDueOn,
  normalizePlanSchedule,
  type SchedulableItem,
} from "@/lib/plan-schedule";

export type OccurrenceLog = {
  performed_on: string;
  occurrence_index: number;
  status: "completed" | "partial" | "too_difficult" | "not_possible";
};

export type OccurrenceProgress = {
  plannedToday: number;
  documentedToday: number;
  completedToday: number;
  nextOccurrenceIndex: number | null;
  canDocument: boolean;
  fullyDocumentedToday: boolean;
  fullyCompletedToday: boolean;
  weekly: {
    target: number;
    documented: number;
    completed: number;
  } | null;
};

/** Monday/Sunday ISO dates for the week containing `isoDate`. */
export function isoWeekRange(isoDate: string): { start: string; end: string } {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const isoWeekday = date.getUTCDay() || 7;
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - (isoWeekday - 1));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function firstMissingOccurrence(logs: OccurrenceLog[], planned: number): number | null {
  const used = new Set(logs.map((log) => log.occurrence_index));
  for (let index = 1; index <= planned; index += 1) {
    if (!used.has(index)) return index;
  }
  return null;
}

/**
 * Pure progress calculation shared by Today and exercise details.
 * A documented non-completed outcome consumes its planned occurrence,
 * but is deliberately not counted as a completed occurrence.
 */
export function calculateOccurrenceProgress(
  item: SchedulableItem,
  isoToday: string,
  weekday: number,
  logs: OccurrenceLog[]
): OccurrenceProgress {
  const empty: OccurrenceProgress = {
    plannedToday: 0,
    documentedToday: 0,
    completedToday: 0,
    nextOccurrenceIndex: null,
    canDocument: false,
    fullyDocumentedToday: false,
    fullyCompletedToday: false,
    weekly: null,
  };
  if (!isDueOn(item, isoToday, weekday)) return empty;

  const schedule = normalizePlanSchedule(item.schedule);
  const todayLogs = logs.filter((log) => log.performed_on === isoToday);

  if (schedule.mode === "times_per_week") {
    const range = isoWeekRange(isoToday);
    const weekLogs = logs.filter(
      (log) => log.performed_on >= range.start && log.performed_on <= range.end
    );
    const weeklyDocumented = Math.min(weekLogs.length, schedule.times_per_week);
    const weeklyCompleted = Math.min(
      weekLogs.filter((log) => log.status === "completed").length,
      schedule.times_per_week
    );
    const documentedToday = Math.min(todayLogs.length, 1);
    const completedToday = Math.min(
      todayLogs.filter((log) => log.status === "completed").length,
      1
    );
    // A flexible weekly plan can be documented at most once per day.
    // If today's outcome exists, keep the item visible even when it met the target.
    const plannedToday = documentedToday > 0 || weeklyDocumented < schedule.times_per_week ? 1 : 0;
    const canDocument = plannedToday === 1 && documentedToday === 0;
    return {
      plannedToday,
      documentedToday,
      completedToday,
      nextOccurrenceIndex: canDocument ? 1 : null,
      canDocument,
      fullyDocumentedToday: plannedToday > 0 && documentedToday >= plannedToday,
      fullyCompletedToday: plannedToday > 0 && completedToday >= plannedToday,
      weekly: {
        target: schedule.times_per_week,
        documented: weeklyDocumented,
        completed: weeklyCompleted,
      },
    };
  }

  const plannedToday = schedule.times_per_day;
  const documentedToday = Math.min(todayLogs.length, plannedToday);
  const completedToday = Math.min(
    todayLogs.filter((log) => log.status === "completed").length,
    plannedToday
  );
  const nextOccurrenceIndex = firstMissingOccurrence(todayLogs, plannedToday);
  return {
    plannedToday,
    documentedToday,
    completedToday,
    nextOccurrenceIndex,
    canDocument: nextOccurrenceIndex !== null,
    fullyDocumentedToday: documentedToday >= plannedToday,
    fullyCompletedToday: completedToday >= plannedToday,
    weekly: null,
  };
}
