import { describe, expect, it } from "vitest";
import {
  updateOwnPhoneSchema,
  updatePatientPhoneSchema,
} from "@/lib/validation/profile";

describe("phone validation", () => {
  it("accepts an empty phone (optional field)", () => {
    const result = updateOwnPhoneSchema.safeParse({ phone: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("");
  });

  it("accepts common formats and trims whitespace", () => {
    for (const phone of ["+352 621 123 456", "0049 (0)151 2345678", "26 12 34-1", "  +352621123456  "]) {
      const result = updateOwnPhoneSchema.safeParse({ phone });
      expect(result.success).toBe(true);
    }
    const trimmed = updateOwnPhoneSchema.safeParse({ phone: "  +352 621 123 456  " });
    if (trimmed.success) expect(trimmed.data.phone).toBe("+352 621 123 456");
  });

  it("rejects letters and other invalid characters", () => {
    for (const phone of ["callme", "0621 abc", "tel:+352", "+352;621"]) {
      expect(updateOwnPhoneSchema.safeParse({ phone }).success).toBe(false);
    }
  });

  it("rejects numbers with fewer than 3 digits", () => {
    expect(updateOwnPhoneSchema.safeParse({ phone: "+1" }).success).toBe(false);
  });

  it("rejects overlong values", () => {
    expect(
      updateOwnPhoneSchema.safeParse({ phone: "1".repeat(31) }).success
    ).toBe(false);
  });

  it("requires a valid patient id for practice-side updates", () => {
    expect(
      updatePatientPhoneSchema.safeParse({ patientId: "nope", phone: "123456" }).success
    ).toBe(false);
    expect(
      updatePatientPhoneSchema.safeParse({
        patientId: "6f4f650b-eae9-421f-a4af-0af47ce4025e",
        phone: "123456",
      }).success
    ).toBe(true);
  });
});
