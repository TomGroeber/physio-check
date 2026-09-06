import { describe, expect, it } from "vitest";
import { changeEmailSchema, registerSchema } from "./auth";

describe("changeEmailSchema", () => {
  it("normalisiert eine gültige neue E-Mail-Adresse", () => {
    expect(changeEmailSchema.parse({ email: "  Petra@Example.COM  " })).toEqual({
      email: "petra@example.com",
    });
  });

  it("lehnt eine ungültige E-Mail-Adresse ab", () => {
    expect(changeEmailSchema.safeParse({ email: "keine-adresse" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validBase = {
    fullName: "Petra Muster",
    email: "petra@example.com",
    password: "einlangespasswort",
  };

  it("verlangt die angehakte Einwilligung (Checkbox-Wert \"on\")", () => {
    expect(registerSchema.safeParse({ ...validBase, consent: "on" }).success).toBe(true);
  });

  it("lehnt eine fehlende Einwilligung ab (Checkbox nicht angehakt -> Feld fehlt in FormData)", () => {
    // Ein natives, nicht angehaktes Checkbox-Feld fehlt in FormData komplett;
    // formData.get(...) liefert dafür null.
    const result = registerSchema.safeParse({ ...validBase, consent: null });
    expect(result.success).toBe(false);
  });

  it("lehnt jeden anderen Wert als \"on\" ab", () => {
    expect(registerSchema.safeParse({ ...validBase, consent: "off" }).success).toBe(false);
  });
});
