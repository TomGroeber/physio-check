/**
 * Reine Kalenderlogik (ohne Zeitzonen): Rechnen mit ISO-Kalendertagen
 * (JJJJ-MM-TT) für Monats-, Wochen- und Tagesansicht. Die Umrechnung
 * von Kalendertagen in UTC-Zeitpunkte übernimmt `src/lib/datetime.ts`.
 */

export const calendarViews = ["month", "week", "day", "list"] as const;
export type CalendarView = (typeof calendarViews)[number];

export function isCalendarView(value: string): value is CalendarView {
  return (calendarViews as readonly string[]).includes(value);
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toUtcMidnight(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Kalendertag um `days` Tage verschieben. */
export function addDaysIso(isoDate: string, days: number): string {
  const date = toUtcMidnight(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** Erster Tag des Monats, um `months` Monate verschoben. */
export function addMonthsIso(isoDate: string, months: number): string {
  const [year, month] = isoDate.split("-").map(Number);
  return toIso(new Date(Date.UTC(year, month - 1 + months, 1)));
}

/** Wochentag 1–7 (Montag=1 … Sonntag=7, ISO 8601). */
export function isoWeekday(isoDate: string): number {
  const day = toUtcMidnight(isoDate).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Montag der Woche, in der der Tag liegt. */
export function startOfWeekIso(isoDate: string): string {
  return addDaysIso(isoDate, 1 - isoWeekday(isoDate));
}

/** Erster Tag des Monats. */
export function startOfMonthIso(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/** Gehören zwei Tage zum selben Kalendermonat? */
export function isSameMonth(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

/**
 * 42 Kalendertage (6 volle Wochen ab Montag) für die Monatsansicht.
 * Immer 6 Wochen, damit das Raster eine stabile Höhe hat.
 */
export function monthGridDays(isoDate: string): string[] {
  const gridStart = startOfWeekIso(startOfMonthIso(isoDate));
  return Array.from({ length: 42 }, (_, i) => addDaysIso(gridStart, i));
}

/** Die 7 Kalendertage (Mo–So) der Woche, in der der Tag liegt. */
export function weekDaysIso(isoDate: string): string[] {
  const start = startOfWeekIso(isoDate);
  return Array.from({ length: 7 }, (_, i) => addDaysIso(start, i));
}

/**
 * Sichtbarer Datumsbereich einer Ansicht als Kalendertage:
 * `start` einschließlich, `endExclusive` ausschließlich.
 * Die Listenansicht zeigt ab dem gewählten Tag 60 Tage voraus.
 */
export function visibleRange(
  view: CalendarView,
  isoDate: string
): { start: string; endExclusive: string } {
  switch (view) {
    case "month": {
      const days = monthGridDays(isoDate);
      return { start: days[0], endExclusive: addDaysIso(days[41], 1) };
    }
    case "week": {
      const start = startOfWeekIso(isoDate);
      return { start, endExclusive: addDaysIso(start, 7) };
    }
    case "day":
      return { start: isoDate, endExclusive: addDaysIso(isoDate, 1) };
    case "list":
      return { start: isoDate, endExclusive: addDaysIso(isoDate, 60) };
  }
}

/** Navigationsziel für "vorheriger"/"nächster" Zeitraum. */
export function navigateDate(
  view: CalendarView,
  isoDate: string,
  direction: 1 | -1
): string {
  switch (view) {
    case "month":
      return addMonthsIso(isoDate, direction);
    case "week":
      return addDaysIso(isoDate, 7 * direction);
    case "day":
      return addDaysIso(isoDate, direction);
    case "list":
      return addDaysIso(isoDate, 60 * direction);
  }
}
