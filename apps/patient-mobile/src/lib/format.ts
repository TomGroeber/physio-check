import type { normalizePlanSchedule } from "@physio-check/shared";
import { web } from "@/messages/de";
import type { TodayExercise } from "@/data/today";

const t = web.patient.today;
const u = web.units;

/** Kurzzusammenfassung der Vorgaben, z. B. „3 Sätze · 12 Wiederholungen“ (wie Web). */
export function prescriptionSummary(exercise: {
  sets: number | null;
  repetitions: number | null;
  holdSeconds: number | null;
  totalDurationSeconds: number | null;
}): string {
  const parts: string[] = [];
  if (exercise.sets)
    parts.push(`${exercise.sets} ${exercise.sets === 1 ? u.set : u.sets}`);
  if (exercise.repetitions) parts.push(`${exercise.repetitions} ${u.repetitions}`);
  if (exercise.holdSeconds) parts.push(u.holdSeconds(exercise.holdSeconds));
  if (exercise.totalDurationSeconds)
    parts.push(u.minutes(Math.round(exercise.totalDurationSeconds / 60)));
  return parts.join(" · ");
}

/** Genau EIN kompakter Fortschritt pro Übungskarte (wie Web-Heute-Seite). */
export function progressLine(exercise: TodayExercise): string | null {
  if (exercise.weeklyProgress) {
    return t.progressWeek(exercise.weeklyProgress.documented, exercise.weeklyProgress.target);
  }
  if (exercise.plannedToday > 1) {
    return t.progressToday(exercise.documentedToday, exercise.plannedToday);
  }
  return null;
}

/** Häufigkeitstext wie exercise-view.tsx der Website. */
export function scheduleText(
  schedule: ReturnType<typeof normalizePlanSchedule>
): string {
  if (!schedule) return "";
  if (schedule.mode === "times_per_week") {
    return web.patient.exercise.scheduleFlexible(schedule.times_per_week);
  }
  const days = schedule.weekdays
    .map((weekday) => web.patient.session.weekdaysShort[weekday - 1])
    .join(", ");
  return web.patient.exercise.scheduleFixed(days, schedule.times_per_day);
}

/** Vorgaben-Chips wie exercise-view.tsx der Website. */
export function prescriptionChips(detail: {
  sets: number | null;
  repetitions: number | null;
  holdSeconds: number | null;
  totalDurationSeconds: number | null;
  restSeconds: number | null;
  equipment: string;
}): string[] {
  const chips: string[] = [];
  if (detail.sets) chips.push(`${detail.sets} ${detail.sets === 1 ? u.set : u.sets}`);
  if (detail.repetitions) chips.push(`${detail.repetitions} ${u.repetitions}`);
  if (detail.holdSeconds) chips.push(u.holdSeconds(detail.holdSeconds));
  if (detail.totalDurationSeconds)
    chips.push(u.minutes(Math.round(detail.totalDurationSeconds / 60)));
  if (detail.restSeconds) chips.push(u.restSeconds(detail.restSeconds));
  if (detail.equipment)
    chips.push(`${web.patient.exercise.equipment}: ${detail.equipment}`);
  return chips;
}
