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
});
