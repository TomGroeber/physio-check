import { describe, expect, it } from "vitest";
import {
  buildAdherenceAnalytics,
  dateRangeEnding,
  plannedOccurrencesInRange,
  type AnalyticsLog,
  type AnalyticsPlanItem,
} from "@/lib/adherence-analytics";

const item = (schedule: unknown): AnalyticsPlanItem => ({
  id: "item-1",
  exerciseId: "exercise-1",
  exerciseTitle: "Brücke",
  startDate: "2026-07-01",
  endDate: null,
  schedule,
});

describe("plannedOccurrencesInRange", () => {
  it("counts fixed weekdays with several daily occurrences", () => {
    expect(
      plannedOccurrencesInRange(
        item({ mode: "weekdays", weekdays: [1, 3, 5], times_per_day: 2, preferred_times: [] }),
        "2026-07-13",
        "2026-07-19"
      )
    ).toBe(6);
  });

  it("counts flexible weekly targets per calendar week and respects partial weeks", () => {
    const flexible = item({ mode: "times_per_week", times_per_week: 3, times_per_day: 1, preferred_times: [] });
    expect(plannedOccurrencesInRange(flexible, "2026-07-13", "2026-07-19")).toBe(3);
    expect(plannedOccurrencesInRange(flexible, "2026-07-18", "2026-07-19")).toBe(2);
  });

  it("respects item start and end dates", () => {
    expect(
      plannedOccurrencesInRange(
        { ...item({ weekdays: [1, 2, 3, 4, 5, 6, 7] }), startDate: "2026-07-15", endDate: "2026-07-16" },
        "2026-07-13",
        "2026-07-19"
      )
    ).toBe(2);
  });
});

describe("buildAdherenceAnalytics", () => {
  it("separates documented, completed, feedback, pain and unread counts", () => {
    const logs: AnalyticsLog[] = [
      { id: "1", planItemId: "item-1", performedOn: "2026-07-13", performedAt: "2026-07-13T08:00:00Z", status: "completed", painBefore: 3, painAfter: 2, reviewedAt: "2026-07-13T09:00:00Z" },
      { id: "2", planItemId: "item-1", performedOn: "2026-07-15", performedAt: "2026-07-15T08:00:00Z", status: "too_difficult", painBefore: 3, painAfter: 7, reviewedAt: null },
    ];
    const result = buildAdherenceAnalytics(
      [item({ mode: "weekdays", weekdays: [1, 3, 5], times_per_day: 1, preferred_times: [] })],
      logs,
      "2026-07-13",
      "2026-07-19"
    );
    expect(result).toMatchObject({
      planned: 3,
      documented: 2,
      completed: 1,
      tooDifficult: 1,
      painFlags: 1,
      unread: 1,
      lastPerformedAt: "2026-07-15T08:00:00Z",
    });
  });
});

describe("dateRangeEnding", () => {
  it("creates inclusive 7 and 30 day windows", () => {
    expect(dateRangeEnding("2026-07-19", 7)).toEqual({ start: "2026-07-13", end: "2026-07-19" });
    expect(dateRangeEnding("2026-07-30", 30).start).toBe("2026-07-01");
  });
});
