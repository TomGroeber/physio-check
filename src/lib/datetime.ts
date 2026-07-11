/**
 * Zentrale, zeitzonensichere Datums- und Zeitfunktionen.
 * Regel (CLAUDE.md): Datums-/Zeitformatierung läuft NUR über dieses
 * Modul. In der Datenbank liegen alle Zeitpunkte in UTC; Termine
 * tragen zusätzlich die IANA-Zeitzone der Praxis.
 */

const LOCALE = "de-DE";

/** ISO-Kalendertag (JJJJ-MM-TT) für einen Zeitpunkt in einer Zeitzone. */
export function isoDateInTimeZone(date: Date, timeZone: string): string {
  // en-CA liefert das Format JJJJ-MM-TT direkt.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Heutiger Kalendertag (JJJJ-MM-TT) in einer Zeitzone. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  return isoDateInTimeZone(now, timeZone);
}

/** Wochentag 1–7 (Montag=1 … Sonntag=7, ISO 8601) in einer Zeitzone. */
export function isoWeekdayInTimeZone(date: Date, timeZone: string): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7,
  };
  return map[name];
}

/** Zeitzonen-Versatz (in ms) einer Zeitzone zu UTC zum gegebenen Zeitpunkt. */
function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return asUtc - date.getTime();
}

/**
 * UTC-Zeitpunkte für Beginn und Ende (exklusiv) eines Kalendertags in
 * einer Zeitzone – sommerzeitsicher, für Abfragen wie "Termine heute".
 */
export function dayRangeUtc(
  isoDate: string,
  timeZone: string
): { start: Date; end: Date } {
  const toUtc = (iso: string): Date => {
    const guess = new Date(`${iso}T00:00:00Z`);
    // Zweiter Durchlauf fängt Verschiebungen an Sommerzeit-Grenzen ab.
    const first = new Date(guess.getTime() - timeZoneOffsetMs(guess, timeZone));
    return new Date(guess.getTime() - timeZoneOffsetMs(first, timeZone));
  };
  const start = toUtc(isoDate);
  const nextDay = new Date(`${isoDate}T12:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const end = toUtc(nextDay.toISOString().slice(0, 10));
  return { start, end };
}

/** Langes Datum, z. B. "Freitag, 11. Juli 2026". */
export function formatDateLong(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Kurzes Datum, z. B. "11.07.2026". */
export function formatDateShort(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/** Uhrzeit, z. B. "14:30". */
export function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Datum + Uhrzeit, z. B. "Fr., 11.07.2026, 14:30". */
export function formatDateTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
