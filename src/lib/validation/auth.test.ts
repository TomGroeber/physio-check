import { describe, expect, it } from "vitest";
import { changeEmailSchema } from "./auth";

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
