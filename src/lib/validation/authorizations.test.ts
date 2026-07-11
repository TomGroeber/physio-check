import { describe, expect, it } from "vitest";
import { adjustAuthorizationSchema, createAuthorizationSchema } from "./authorizations";

describe("authorization validation", () => {
  const patientId = "11111111-1111-4111-8111-111111111111";

  it("accepts a plausible prescription", () => {
    expect(createAuthorizationSchema.safeParse({
      patientId,
      title: "Verordnung",
      reference: "",
      prescribedSessions: "12",
      issuedOn: "2026-07-11",
      validFrom: "2026-07-11",
      validUntil: "2026-12-31",
      prescribingDoctor: "",
      note: "",
    }).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    expect(createAuthorizationSchema.safeParse({
      patientId,
      title: "Verordnung",
      reference: "",
      prescribedSessions: "12",
      issuedOn: "2026-07-11",
      validFrom: "2026-08-01",
      validUntil: "2026-07-01",
      prescribingDoctor: "",
      note: "",
    }).success).toBe(false);
  });

  it("requires a non-zero adjustment and reason", () => {
    expect(adjustAuthorizationSchema.safeParse({
      patientId,
      authorizationId: "22222222-2222-4222-8222-222222222222",
      sessionDelta: "0",
      reason: "Korrektur",
    }).success).toBe(false);
  });
});

