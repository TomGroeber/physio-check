import { isoWeekRange } from "@/lib/occurrences";
import { normalizePlanSchedule } from "@/lib/plan-schedule";

export type AnalyticsPlanItem = {
  id: string;
  exerciseId: string;
  exerciseTitle: string;
  startDate: string;
  endDate: string | null;
  schedule: unknown;
};

export type AnalyticsLog = {
  id: string;
  planItemId: string;
  performedOn: string;
  performedAt: string;
  status: "completed" | "partial" | "too_difficult" | "not_possible";
  painBefore: number | null;
  painAfter: number | null;
  reviewedAt: string | null;
};

export type ExerciseAdherence = {
  planItemId: string;
  exerciseId: string;
  exerciseTitle: string;
  planned: number;
  documented: number;
  completed: number;
  feedback: number;
  lastPerformedAt: string | null;
};

export type AdherenceAnalytics = {
  planned: number;
  documented: number;
  completed: number;
  partial: number;
  tooDifficult: number;
  notPossible: number;
  painFlags: number;
  unread: number;
  lastPerformedAt: string | null;
  exercises: ExerciseAdherence[];
};

export function dateRangeEnding(isoEnd: string, days: number): { start: string; end: string } {
  const end = new Date(`${isoEnd}T12:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start: start.toISOString().slice(0, 10), end: isoEnd };
}

function eachIsoDate(start: string, end: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${start}T12:00:00Z`);
  const final = new Date(`${end}T12:00:00Z`);
  while (current <= final) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function isoWeekday(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay() || 7;
}

export function plannedOccurrencesInRange(
  item: AnalyticsPlanItem,
  rangeStart: string,
  rangeEnd: string
): number {
  const start = item.startDate > rangeStart ? item.startDate : rangeStart;
  const boundedEnd = item.endDate && item.endDate < rangeEnd ? item.endDate : rangeEnd;
  if (start > boundedEnd) return 0;
  const schedule = normalizePlanSchedule(item.schedule);
  const dates = eachIsoDate(start, boundedEnd);
  if (schedule.mode === "weekdays") {
    return dates.reduce(
      (sum, date) =>
        sum + (schedule.weekdays.includes(isoWeekday(date)) ? schedule.times_per_day : 0),
      0
    );
  }

  // A flexible weekly target has no prescribed weekday. For a partial
  // calendar week, no more occurrences are expected than eligible days.
  const eligibleDaysByWeek = new Map<string, number>();
  for (const date of dates) {
    const weekStart = isoWeekRange(date).start;
    eligibleDaysByWeek.set(weekStart, (eligibleDaysByWeek.get(weekStart) ?? 0) + 1);
  }
  return [...eligibleDaysByWeek.values()].reduce(
    (sum, eligibleDays) => sum + Math.min(schedule.times_per_week, eligibleDays),
    0
  );
}

function isPainFlag(log: AnalyticsLog): boolean {
  if (log.painAfter === null) return false;
  return log.painAfter >= 7 || (log.painBefore !== null && log.painAfter > log.painBefore);
}

export function buildAdherenceAnalytics(
  items: AnalyticsPlanItem[],
  logs: AnalyticsLog[],
  rangeStart: string,
  rangeEnd: string
): AdherenceAnalytics {
  const rangeLogs = logs.filter(
    (log) => log.performedOn >= rangeStart && log.performedOn <= rangeEnd
  );
  const exercises = items.map((item) => {
    const itemLogs = rangeLogs.filter((log) => log.planItemId === item.id);
    return {
      planItemId: item.id,
      exerciseId: item.exerciseId,
      exerciseTitle: item.exerciseTitle,
      planned: plannedOccurrencesInRange(item, rangeStart, rangeEnd),
      documented: itemLogs.length,
      completed: itemLogs.filter((log) => log.status === "completed").length,
      feedback: itemLogs.filter((log) => log.status !== "completed").length,
      lastPerformedAt:
        itemLogs.map((log) => log.performedAt).sort().at(-1) ?? null,
    };
  });
  return {
    planned: exercises.reduce((sum, exercise) => sum + exercise.planned, 0),
    documented: rangeLogs.length,
    completed: rangeLogs.filter((log) => log.status === "completed").length,
    partial: rangeLogs.filter((log) => log.status === "partial").length,
    tooDifficult: rangeLogs.filter((log) => log.status === "too_difficult").length,
    notPossible: rangeLogs.filter((log) => log.status === "not_possible").length,
    painFlags: rangeLogs.filter(isPainFlag).length,
    unread: rangeLogs.filter((log) => !log.reviewedAt).length,
    lastPerformedAt: rangeLogs.map((log) => log.performedAt).sort().at(-1) ?? null,
    exercises,
  };
}
