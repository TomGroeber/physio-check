import { describe, expect, it } from "vitest";
import { publishPlanSchema } from "@/lib/validation/plans";

const item = {
  exerciseId: "00000000-0000-4000-8000-000000000001",
  startDate: "2026-07-13",
  endDate: null,
  schedule: {
    mode: "weekdays",
    weekdays: [1, 3, 5],
    times_per_day: 2,
    preferred_times: ["08:00", "18:00"],
  },
  sets: 3,
  repetitions: 10,
  holdSeconds: null,
  totalDurationSeconds: null,
  restSeconds: 30,
  note: "Langsam ausführen",
};

describe("publishPlanSchema", () => {
  it("accepts a complete typed plan", () => {
    expect(
      publishPlanSchema.safeParse({
        patientId: "00000000-0000-4000-8000-000000000002",
        title: "Knie – Aufbau",
        changeNote: "Belastung angepasst",
        items: [item],
      }).success
    ).toBe(true);
  });

  it("rejects duplicate exercises", () => {
    expect(
      publishPlanSchema.safeParse({
        patientId: "00000000-0000-4000-8000-000000000002",
        title: "Knie – Aufbau",
        changeNote: "",
        items: [item, item],
      }).success
    ).toBe(false);
  });

  it("rejects invalid date ranges and dosage limits", () => {
    expect(
      publishPlanSchema.safeParse({
        patientId: "00000000-0000-4000-8000-000000000002",
        title: "Knie – Aufbau",
        changeNote: "",
        items: [{ ...item, startDate: "2026-07-15", endDate: "2026-07-14", sets: 21 }],
      }).success
    ).toBe(false);
  });

  it("preserves patient-specific dosage, date range and daily frequency", () => {
    const parsed = publishPlanSchema.parse({
      patientId: "00000000-0000-4000-8000-000000000002",
      title: "Individueller Plan",
      changeNote: "Patientenspezifische Werte",
      items: [{ ...item, startDate: "2026-08-01", endDate: "2026-09-15", sets: 4 }],
    });
    expect(parsed.items[0]).toMatchObject({
      startDate: "2026-08-01",
      endDate: "2026-09-15",
      sets: 4,
      schedule: { mode: "weekdays", weekdays: [1, 3, 5], times_per_day: 2 },
    });
  });

  it("accepts a flexible N-times-per-week schedule", () => {
    const result = publishPlanSchema.safeParse({
      patientId: "00000000-0000-4000-8000-000000000002",
      title: "Flexibler Plan",
      changeNote: "",
      items: [
        {
          ...item,
          schedule: {
            mode: "times_per_week",
            times_per_week: 3,
            times_per_day: 1,
            preferred_times: ["09:00"],
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});
