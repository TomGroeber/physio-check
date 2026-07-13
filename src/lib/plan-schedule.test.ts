import { describe, expect, it } from "vitest";
import {
  isDueOn,
  normalizePlanSchedule,
  plannedOccurrencesOnDay,
  planScheduleSchema,
} from "./plan-schedule";

const base = { start_date: "2026-07-01", end_date: null };

describe("planScheduleSchema", () => {
  it("accepts fixed weekdays with several occurrences and preferred times", () => {
    expect(
      planScheduleSchema.safeParse({
        mode: "weekdays",
        weekdays: [1, 3, 5],
        times_per_day: 2,
        preferred_times: ["08:00", "18:00"],
      }).success
    ).toBe(true);
  });

  it("rejects duplicate days, invalid times and too many preferred times", () => {
    expect(
      planScheduleSchema.safeParse({
        mode: "weekdays",
        weekdays: [1, 1],
        times_per_day: 1,
        preferred_times: ["25:00", "18:00"],
      }).success
    ).toBe(false);
  });

  it("accepts a patient-selected number of days per week", () => {
    expect(
      planScheduleSchema.safeParse({
        mode: "times_per_week",
        times_per_week: 3,
        times_per_day: 1,
        preferred_times: [],
      }).success
    ).toBe(true);
  });
});

describe("normalizePlanSchedule", () => {
  it("keeps legacy weekday plans readable", () => {
    expect(normalizePlanSchedule({ weekdays: [1, 3, 5] })).toEqual({
      mode: "weekdays",
      weekdays: [1, 3, 5],
      times_per_day: 1,
      preferred_times: [],
    });
  });

  it("keeps legacy weekly-frequency plans readable", () => {
    expect(normalizePlanSchedule({ times_per_week: 3 })).toMatchObject({
      mode: "times_per_week",
      times_per_week: 3,
    });
  });
});

describe("isDueOn", () => {
  it("is due only on selected weekdays and within its date range", () => {
    const item = {
      ...base,
      end_date: "2026-07-13",
      schedule: {
        mode: "weekdays",
        weekdays: [1, 3, 5],
        times_per_day: 2,
        preferred_times: [],
      },
    };
    expect(isDueOn(item, "2026-07-13", 1)).toBe(true);
    expect(isDueOn(item, "2026-07-14", 2)).toBe(false);
    expect(isDueOn({ ...item, end_date: null }, "2026-06-30", 2)).toBe(false);
  });

  it("offers weekly-frequency plans on every eligible day", () => {
    const item = {
      ...base,
      schedule: {
        mode: "times_per_week",
        times_per_week: 3,
        times_per_day: 1,
        preferred_times: [],
      },
    };
    expect(isDueOn(item, "2026-07-14", 2)).toBe(true);
  });

  it("treats missing schedule data as once daily for legacy safety", () => {
    expect(isDueOn({ ...base, schedule: null }, "2026-07-14", 2)).toBe(true);
  });
});

describe("plannedOccurrencesOnDay", () => {
  it("returns the configured occurrences on selected days", () => {
    const item = {
      ...base,
      schedule: {
        mode: "weekdays",
        weekdays: [1],
        times_per_day: 3,
        preferred_times: ["08:00", "13:00", "18:00"],
      },
    };
    expect(plannedOccurrencesOnDay(item, "2026-07-13", 1)).toBe(3);
    expect(plannedOccurrencesOnDay(item, "2026-07-14", 2)).toBe(0);
  });
});
