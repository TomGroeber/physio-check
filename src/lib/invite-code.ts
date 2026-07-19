import { createHash, randomInt } from "node:crypto";
import {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  normalizeInviteCode,
} from "@physio-check/shared/invite-code-format";

// Formatlogik liegt im plattformneutralen Paket (D-059); Erzeugung und
// Hashing bleiben serverseitig hier.
export {
  INVITE_CODE_ALPHABET,
  INVITE_CODE_LENGTH,
  formatInviteCode,
  isInviteCodeShapeValid,
  normalizeInviteCode,
} from "@physio-check/shared/invite-code-format";

export function generateInviteCode(): string {
  return Array.from({ length: INVITE_CODE_LENGTH }, () =>
    INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)]
  ).join("");
}

export function hashInviteCode(value: string): string {
  return createHash("sha256").update(normalizeInviteCode(value)).digest("hex");
}
