import { createHash, randomInt } from "node:crypto";

export const INVITE_CODE_LENGTH = 12;
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Entfernt Trennzeichen und vereinheitlicht die Eingabe. */
export function normalizeInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** Gut lesbare Darstellung, z. B. ABCD-EFGH-JK23. */
export function formatInviteCode(value: string): string {
  return normalizeInviteCode(value).match(/.{1,4}/g)?.join("-") ?? "";
}

export function isInviteCodeShapeValid(value: string): boolean {
  const normalized = normalizeInviteCode(value);
  return (
    normalized.length === INVITE_CODE_LENGTH &&
    [...normalized].every((character) =>
      INVITE_CODE_ALPHABET.includes(character)
    )
  );
}

export function generateInviteCode(): string {
  return Array.from({ length: INVITE_CODE_LENGTH }, () =>
    INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)]
  ).join("");
}

export function hashInviteCode(value: string): string {
  return createHash("sha256").update(normalizeInviteCode(value)).digest("hex");
}

