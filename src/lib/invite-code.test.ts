import { describe, expect, it } from "vitest";
import {
  formatInviteCode,
  generateInviteCode,
  hashInviteCode,
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  isInviteCodeShapeValid,
  normalizeInviteCode,
} from "./invite-code";

describe("invite codes", () => {
  it("normalisiert Groß-/Kleinschreibung und Trennzeichen", () => {
    expect(normalizeInviteCode(" abcd-efgh jk23 ")).toBe("ABCDEFGHJK23");
  });

  it("formatiert Codes in lesbaren Vierergruppen", () => {
    expect(formatInviteCode("ABCDEFGHJK23")).toBe("ABCD-EFGH-JK23");
  });

  it("erzeugt ausschließlich erlaubte, nicht verwechselbare Zeichen", () => {
    for (let index = 0; index < 100; index += 1) {
      const code = generateInviteCode();
      expect(code).toHaveLength(INVITE_CODE_LENGTH);
      expect([...code].every((character) => INVITE_CODE_ALPHABET.includes(character))).toBe(true);
      expect(isInviteCodeShapeValid(code)).toBe(true);
    }
  });

  it("hasht formatierte und unformatierte Schreibweise identisch", () => {
    expect(hashInviteCode("ABCD-EFGH-JK23")).toBe(
      hashInviteCode("abcdefghjk23")
    );
  });
});

