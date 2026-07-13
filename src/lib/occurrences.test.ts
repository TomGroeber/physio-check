import { describe, expect, it } from "vitest";
import { calculateOccurrenceProgress, isoWeekRange, type OccurrenceLog } from "@/lib/occurrences";

const base = { start_date: "2026-07-01", end_date: null };
const log = (
  occurrenceIndex: number,
  status: OccurrenceLog["status"] = "completed",
  performedOn = "2026-07-13"
): OccurrenceLog => ({
  performed_on: performedOn,
  occurrence_index: occurrenceIndex,
  status,
});

describe("isoWeekRange", () => {
  it("returns Monday through Sunday for the selected date", () => {
    expect(isoWeekRange("2026-07-15")).toEqual({
      start: "2026-07-13",
      end: "2026-07-19",
    });
  });
});

describe("calculateOccurrenceProgress", () => {
  it("completes a once-daily exercise with exactly one separated occurrence", () => {
    const progress = calculateOccurrenceProgress(
      {
        ...base,
        schedule: {
          mode: "weekdays",
          weekdays: [1],
          times_per_day: 1,
          preferred_times: [],
        },
      },
      "2026-07-13",
      1,
      [log(1)]
    );
    expect(progress).toMatchObject({
      plannedToday: 1,
      documentedToday: 1,
      nextOccurrenceIndex: null,
      canDocument: false,
    });
  });

  it("keeps a three-times-daily exercise open after its first occurrence", () => {
    const progress = calculateOccurrenceProgress(
      {
        ...base,
        schedule: {
          mode: "weekdays",
          weekdays: [1],
          times_per_day: 3,
          preferred_times: [],
        },
      },
      "2026-07-13",
      1,
      [log(1)]
    );
    expect(progress).toMatchObject({
      plannedToday: 3,
      documentedToday: 1,
      completedToday: 1,
      nextOccurrenceIndex: 2,
      canDocument: true,
      fullyDocumentedToday: false,
    });
  });

  it("does not count partial or difficult outcomes as completed", () => {
    const progress = calculateOccurrenceProgress(
      {
        ...base,
        schedule: {
          mode: "weekdays",
          weekdays: [1],
          times_per_day: 3,
          preferred_times: [],
        },
      },
      "2026-07-13",
      1,
      [log(1, "completed"), log(2, "partial"), log(3, "too_difficult")]
    );
    expect(progress.documentedToday).toBe(3);
    expect(progress.completedToday).toBe(1);
    expect(progress.fullyDocumentedToday).toBe(true);
    expect(progress.fullyCompletedToday).toBe(false);
    expect(progress.canDocument).toBe(false);
  });

  it("offers a weekly target once per day until its weekly count is reached", () => {
    const item = {
      ...base,
      schedule: {
        mode: "times_per_week" as const,
        times_per_week: 3,
        times_per_day: 1 as const,
        preferred_times: [],
      },
    };
    const earlier = [log(1, "completed", "2026-07-13"), log(1, "partial", "2026-07-14")];
    const open = calculateOccurrenceProgress(item, "2026-07-15", 3, earlier);
    expect(open.canDocument).toBe(true);
    expect(open.weekly).toEqual({ target: 3, documented: 2, completed: 1 });

    const reached = calculateOccurrenceProgress(
      item,
      "2026-07-16",
      4,
      [...earlier, log(1, "completed", "2026-07-15")]
    );
    expect(reached.plannedToday).toBe(0);
    expect(reached.canDocument).toBe(false);
  });

  it("keeps legacy once-daily logs readable", () => {
    const progress = calculateOccurrenceProgress(
      { ...base, schedule: { weekdays: [1, 2, 3, 4, 5, 6, 7] } },
      "2026-07-13",
      1,
      [log(1)]
    );
    expect(progress).toMatchObject({
      plannedToday: 1,
      documentedToday: 1,
      completedToday: 1,
      fullyCompletedToday: true,
    });
  });
});
