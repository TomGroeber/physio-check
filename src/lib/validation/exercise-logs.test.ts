import { describe, expect, it } from "vitest";
import {
  completionLogSchema,
  shouldShowPainHint,
} from "./exercise-logs";

const validId = "3f2f4de1-9c1a-4f5e-8f0a-2a97b7f4c111";

describe("completionLogSchema", () => {
  it("akzeptiert eine vollständige Dokumentation (FormData-Strings)", () => {
    const parsed = completionLogSchema.safeParse({
      planItemId: validId,
      status: "completed",
      setsCompleted: "3",
      painBefore: "2",
      painAfter: "1",
      note: "  Ging gut.  ",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.setsCompleted).toBe(3);
      expect(parsed.data.note).toBe("Ging gut.");
    }
  });

  it("macht leere optionale Felder zu undefined", () => {
    const parsed = completionLogSchema.safeParse({
      planItemId: validId,
      status: "too_difficult",
      setsCompleted: "",
      painBefore: "",
      painAfter: "",
      note: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.setsCompleted).toBeUndefined();
      expect(parsed.data.painBefore).toBeUndefined();
      expect(parsed.data.painAfter).toBeUndefined();
    }
  });

  it("weist Schmerzwerte außerhalb von 0–10 ab", () => {
    const parsed = completionLogSchema.safeParse({
      planItemId: validId,
      status: "completed",
      painAfter: "11",
    });
    expect(parsed.success).toBe(false);
  });

  it("weist unbekannte Status ab", () => {
    const parsed = completionLogSchema.safeParse({
      planItemId: validId,
      status: "verified",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts only known return modes for the guided flow", () => {
    expect(
      completionLogSchema.safeParse({
        planItemId: validId,
        status: "completed",
        mode: "guided",
      }).success
    ).toBe(true);
    expect(
      completionLogSchema.safeParse({
        planItemId: validId,
        status: "completed",
        mode: "external-url",
      }).success
    ).toBe(false);
  });

  it("weist zu lange Notizen ab", () => {
    const parsed = completionLogSchema.safeParse({
      planItemId: validId,
      status: "completed",
      note: "x".repeat(1001),
    });
    expect(parsed.success).toBe(false);
  });
});

describe("shouldShowPainHint", () => {
  it("zeigt den Hinweis bei hohem Schmerz nach der Übung", () => {
    expect(shouldShowPainHint({ painAfter: 7 })).toBe(true);
  });

  it("zeigt den Hinweis bei gestiegenem Schmerz", () => {
    expect(shouldShowPainHint({ painBefore: 3, painAfter: 5 })).toBe(true);
  });

  it("zeigt keinen Hinweis bei gesunkenem, niedrigem Schmerz", () => {
    expect(shouldShowPainHint({ painBefore: 3, painAfter: 2 })).toBe(false);
  });

  it("zeigt keinen Hinweis ohne Angabe", () => {
    expect(shouldShowPainHint({})).toBe(false);
  });
});
