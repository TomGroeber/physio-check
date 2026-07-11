/**
 * Reine, testbare Logik für Übungspläne: Ist ein Plan-Item an einem
 * Kalendertag fällig? Wird von Patienten-Startseite, Übungsdetailseite
 * und Dokumentations-Action gemeinsam verwendet.
 */

export type PlanSchedule = { weekdays?: number[]; times_per_week?: number };

export type SchedulableItem = {
  start_date: string;
  end_date: string | null;
  schedule: unknown;
};

/** Ist ein Plan-Item nach Zeitfenster und Wochenplan am Tag `isoDate` fällig? */
export function isDueOn(
  item: SchedulableItem,
  isoDate: string,
  weekday: number
): boolean {
  if (item.start_date > isoDate) return false;
  if (item.end_date && item.end_date < isoDate) return false;
  const schedule = (item.schedule ?? {}) as PlanSchedule;
  if (Array.isArray(schedule.weekdays)) {
    return schedule.weekdays.includes(weekday);
  }
  // Häufigkeit pro Woche: Patient wählt die Tage selbst → immer anbieten.
  return true;
}
