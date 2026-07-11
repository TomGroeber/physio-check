import { describe, expect, it } from "vitest";
import {
  dayRangeUtc,
  formatDateLong,
  formatTime,
  isoDateInTimeZone,
  isoWeekdayInTimeZone,
  todayInTimeZone,
} from "./datetime";

const TZ = "Europe/Luxembourg";

describe("isoDateInTimeZone / todayInTimeZone", () => {
  it("liefert den Kalendertag der Zeitzone, nicht den UTC-Tag", () => {
    // 23:30 UTC am 10.07. ist in Luxemburg (UTC+2 im Sommer) bereits der 11.07.
    const lateEvening = new Date("2026-07-10T23:30:00Z");
    expect(isoDateInTimeZone(lateEvening, TZ)).toBe("2026-07-11");
    expect(todayInTimeZone(TZ, lateEvening)).toBe("2026-07-11");
  });

  it("berücksichtigt Winterzeit (UTC+1)", () => {
    const winterNight = new Date("2026-01-15T23:30:00Z");
    expect(isoDateInTimeZone(winterNight, TZ)).toBe("2026-01-16");
  });
});

describe("isoWeekdayInTimeZone", () => {
  it("gibt ISO-Wochentage zurück (Montag=1, Sonntag=7)", () => {
    // 2026-07-11 ist ein Samstag
    expect(isoWeekdayInTimeZone(new Date("2026-07-11T10:00:00Z"), TZ)).toBe(6);
    // 2026-07-12 ist ein Sonntag
    expect(isoWeekdayInTimeZone(new Date("2026-07-12T10:00:00Z"), TZ)).toBe(7);
  });
});

describe("dayRangeUtc", () => {
  it("Sommertag: 00:00 Ortszeit = 22:00 UTC des Vortags", () => {
    const { start, end } = dayRangeUtc("2026-07-11", TZ);
    expect(start.toISOString()).toBe("2026-07-10T22:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-11T22:00:00.000Z");
  });

  it("Wintertag: 00:00 Ortszeit = 23:00 UTC des Vortags", () => {
    const { start, end } = dayRangeUtc("2026-01-15", TZ);
    expect(start.toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(end.toISOString()).toBe("2026-01-15T23:00:00.000Z");
  });

  it("Tag der Sommerzeit-Umstellung hat 23 Stunden", () => {
    // In der EU beginnt die Sommerzeit 2026 am 29. März.
    const { start, end } = dayRangeUtc("2026-03-29", TZ);
    const hours = (end.getTime() - start.getTime()) / 3_600_000;
    expect(hours).toBe(23);
  });

  it("Tag der Winterzeit-Umstellung hat 25 Stunden", () => {
    // Die Sommerzeit 2026 endet am 25. Oktober.
    const { start, end } = dayRangeUtc("2026-10-25", TZ);
    const hours = (end.getTime() - start.getTime()) / 3_600_000;
    expect(hours).toBe(25);
  });
});

describe("Formatierung", () => {
  const date = new Date("2026-07-11T08:30:00Z"); // 10:30 in Luxemburg

  it("formatiert Uhrzeiten in der Zielzeitzone", () => {
    expect(formatTime(date, TZ)).toBe("10:30");
  });

  it("formatiert lange Datumsangaben auf Deutsch", () => {
    expect(formatDateLong(date, TZ)).toBe("Samstag, 11. Juli 2026");
  });
});
