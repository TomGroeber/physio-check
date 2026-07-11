import { describe, expect, it } from "vitest";
import { isDueOn } from "./plan-schedule";

const base = { start_date: "2026-07-01", end_date: null };

describe("isDueOn", () => {
  it("ist fällig an einem geplanten Wochentag", () => {
    const item = { ...base, schedule: { weekdays: [1, 3, 5] } };
    // 2026-07-13 ist ein Montag (ISO-Wochentag 1)
    expect(isDueOn(item, "2026-07-13", 1)).toBe(true);
  });

  it("ist nicht fällig an einem nicht geplanten Wochentag", () => {
    const item = { ...base, schedule: { weekdays: [1, 3, 5] } };
    expect(isDueOn(item, "2026-07-14", 2)).toBe(false);
  });

  it("ist vor dem Startdatum nicht fällig", () => {
    const item = { ...base, schedule: { weekdays: [1] } };
    expect(isDueOn(item, "2026-06-30", 1)).toBe(false);
  });

  it("ist nach dem Enddatum nicht fällig", () => {
    const item = {
      ...base,
      end_date: "2026-07-10",
      schedule: { weekdays: [1] },
    };
    expect(isDueOn(item, "2026-07-13", 1)).toBe(false);
  });

  it("ist am Enddatum selbst noch fällig", () => {
    const item = {
      ...base,
      end_date: "2026-07-13",
      schedule: { weekdays: [1] },
    };
    expect(isDueOn(item, "2026-07-13", 1)).toBe(true);
  });

  it("bietet Häufigkeit-pro-Woche-Pläne an jedem Tag an", () => {
    const item = { ...base, schedule: { times_per_week: 3 } };
    expect(isDueOn(item, "2026-07-14", 2)).toBe(true);
  });

  it("behandelt fehlende Schedule-Daten wie täglich", () => {
    const item = { ...base, schedule: null };
    expect(isDueOn(item, "2026-07-14", 2)).toBe(true);
  });
});
