import { z } from "zod";

/**
 * Typisierte, zwischen Plan-Builder und Patientenansicht geteilte
 * Zeitplanung. ISO-Wochentage: Montag = 1, Sonntag = 7.
 */

const isoWeekdaySchema = z.number().int().min(1).max(7);
const preferredTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const weekdaysPlanScheduleSchema = z
  .object({
    mode: z.literal("weekdays"),
    weekdays: z.array(isoWeekdaySchema).min(1).max(7),
    times_per_day: z.number().int().min(1).max(6),
    preferred_times: z.array(preferredTimeSchema).max(6).default([]),
  })
  .superRefine((schedule, context) => {
    if (new Set(schedule.weekdays).size !== schedule.weekdays.length) {
      context.addIssue({
        code: "custom",
        path: ["weekdays"],
        message: "Wochentage dürfen nicht doppelt vorkommen.",
      });
    }
    if (new Set(schedule.preferred_times).size !== schedule.preferred_times.length) {
      context.addIssue({
        code: "custom",
        path: ["preferred_times"],
        message: "Uhrzeiten dürfen nicht doppelt vorkommen.",
      });
    }
    if (schedule.preferred_times.length > schedule.times_per_day) {
      context.addIssue({
        code: "custom",
        path: ["preferred_times"],
        message: "Es sind mehr Uhrzeiten als tägliche Durchgänge angegeben.",
      });
    }
  });

export const weeklyPlanScheduleSchema = z.object({
  mode: z.literal("times_per_week"),
  times_per_week: z.number().int().min(1).max(7),
  times_per_day: z.literal(1).default(1),
  preferred_times: z.array(preferredTimeSchema).max(1).default([]),
});

export const planScheduleSchema = z.union([
  weekdaysPlanScheduleSchema,
  weeklyPlanScheduleSchema,
]);

export type PlanSchedule = z.infer<typeof planScheduleSchema>;

export type SchedulableItem = {
  start_date: string;
  end_date: string | null;
  schedule: unknown;
};

const dailyFallback: PlanSchedule = {
  mode: "weekdays",
  weekdays: [1, 2, 3, 4, 5, 6, 7],
  times_per_day: 1,
  preferred_times: [],
};

/**
 * Normalisiert auch die vor Phase D gespeicherten Schedule-Formate.
 * Ungültige historische Daten werden konservativ als einmal täglich
 * dargestellt, bis die Praxis eine neue Planversion veröffentlicht.
 */
export function normalizePlanSchedule(value: unknown): PlanSchedule {
  const typed = planScheduleSchema.safeParse(value);
  if (typed.success) return typed.data;

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const legacy = value as Record<string, unknown>;
    if (Array.isArray(legacy.weekdays)) {
      const parsed = weekdaysPlanScheduleSchema.safeParse({
        mode: "weekdays",
        weekdays: legacy.weekdays,
        times_per_day: 1,
        preferred_times: [],
      });
      if (parsed.success) return parsed.data;
    }
    if (typeof legacy.times_per_week === "number") {
      const parsed = weeklyPlanScheduleSchema.safeParse({
        mode: "times_per_week",
        times_per_week: legacy.times_per_week,
        times_per_day: 1,
        preferred_times: [],
      });
      if (parsed.success) return parsed.data;
    }
  }

  return dailyFallback;
}

/** Ist ein Plan-Item nach Zeitfenster und Wochenplan am Tag `isoDate` fällig? */
export function isDueOn(
  item: SchedulableItem,
  isoDate: string,
  weekday: number
): boolean {
  if (item.start_date > isoDate) return false;
  if (item.end_date && item.end_date < isoDate) return false;
  const schedule = normalizePlanSchedule(item.schedule);
  if (schedule.mode === "weekdays") return schedule.weekdays.includes(weekday);
  // Bei einer Wochenhäufigkeit wählt der Patient die passenden Tage selbst.
  return true;
}

/** Anzahl der für einen festen Wochentag vorgesehenen Tagesdurchgänge. */
export function plannedOccurrencesOnDay(
  item: SchedulableItem,
  isoDate: string,
  weekday: number
): number {
  if (!isDueOn(item, isoDate, weekday)) return 0;
  const schedule = normalizePlanSchedule(item.schedule);
  return schedule.mode === "weekdays" ? schedule.times_per_day : 1;
}
