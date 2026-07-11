import { describe, expect, it } from "vitest";
import { createAppointmentSchema, requestCancellationSchema } from "./appointments";

const valid = {
  patientProfileId: "11111111-1111-4111-8111-111111111111",
  therapistMemberId: "22222222-2222-4222-8222-222222222222",
  date: "2026-07-20",
  startTime: "09:30",
  durationMinutes: "45",
  locationName: "Praxis",
  note: "",
};

describe("appointment validation", () => {
  it("akzeptiert und konvertiert gültige Formulardaten", () => {
    const result = createAppointmentSchema.parse(valid);
    expect(result.durationMinutes).toBe(45);
  });

  it("lehnt ungültige Zeit und überlange Notizen ab", () => {
    expect(createAppointmentSchema.safeParse({ ...valid, startTime: "25:00" }).success).toBe(false);
    expect(createAppointmentSchema.safeParse({ ...valid, note: "x".repeat(501) }).success).toBe(false);
  });

  it("begrenzt neutrale Absagegründe", () => {
    expect(requestCancellationSchema.safeParse({ appointmentId: valid.patientProfileId, reason: "Termin passt nicht" }).success).toBe(true);
    expect(requestCancellationSchema.safeParse({ appointmentId: valid.patientProfileId, reason: "x".repeat(301) }).success).toBe(false);
  });
});

