import { describe, expect, it } from "vitest";
import { isWithinQuietHours, shouldShowExerciseReminder } from "./reminders";

describe("isWithinQuietHours", () => {
  it("handles a quiet period across midnight", () => {
    expect(isWithinQuietHours("20:00", "20:00", "08:00")).toBe(true);
    expect(isWithinQuietHours("03:15", "20:00", "08:00")).toBe(true);
    expect(isWithinQuietHours("08:00", "20:00", "08:00")).toBe(false);
    expect(isWithinQuietHours("14:00", "20:00", "08:00")).toBe(false);
  });

  it("handles a same-day quiet period", () => {
    expect(isWithinQuietHours("12:30", "12:00", "14:00")).toBe(true);
    expect(isWithinQuietHours("14:00", "12:00", "14:00")).toBe(false);
  });

  it("treats equal start and end as disabled quiet hours", () => {
    expect(isWithinQuietHours("20:00", "08:00", "08:00")).toBe(false);
  });

  it("rejects malformed times", () => {
    expect(() => isWithinQuietHours("24:00", "20:00", "08:00")).toThrow();
  });
});

describe("shouldShowExerciseReminder", () => {
  const base = {
    enabled: true,
    remainingOccurrences: 2,
    localTime: "15:00",
    quietStart: "20:00",
    quietEnd: "08:00",
  };

  it("shows only enabled reminders for outstanding occurrences", () => {
    expect(shouldShowExerciseReminder(base)).toBe(true);
    expect(shouldShowExerciseReminder({ ...base, enabled: false })).toBe(false);
    expect(shouldShowExerciseReminder({ ...base, remainingOccurrences: 0 })).toBe(false);
  });

  it("suppresses reminders during quiet hours", () => {
    expect(shouldShowExerciseReminder({ ...base, localTime: "22:00" })).toBe(false);
  });
});
