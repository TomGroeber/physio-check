import { describe, expect, it } from "vitest";
import { isIsoDate, monthGridDays, navigateDate, startOfWeekIso, visibleRange, weekDaysIso } from "./calendar";

describe("calendar helpers", () => {
  it("validiert echte ISO-Kalendertage", () => {
    expect(isIsoDate("2026-07-11")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("11.07.2026")).toBe(false);
  });

  it("berechnet die Woche ab Montag", () => {
    expect(startOfWeekIso("2026-07-11")).toBe("2026-07-06");
    expect(weekDaysIso("2026-07-11")).toEqual([
      "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09",
      "2026-07-10", "2026-07-11", "2026-07-12",
    ]);
  });

  it("liefert ein stabiles Monatsraster mit 42 Tagen", () => {
    const days = monthGridDays("2026-07-11");
    expect(days).toHaveLength(42);
    expect(days[0]).toBe("2026-06-29");
    expect(days[41]).toBe("2026-08-09");
  });

  it("navigiert passend zur Ansicht", () => {
    expect(navigateDate("month", "2026-07-11", 1)).toBe("2026-08-01");
    expect(navigateDate("week", "2026-07-11", -1)).toBe("2026-07-04");
    expect(visibleRange("day", "2026-07-11")).toEqual({ start: "2026-07-11", endExclusive: "2026-07-12" });
  });
});

