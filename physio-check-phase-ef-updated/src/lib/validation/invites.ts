import { z } from "zod";
import { isInviteCodeShapeValid, normalizeInviteCode } from "@/lib/invite-code";
import { de } from "@/messages/de";

export const inviteCodeSchema = z
  .string()
  .trim()
  .transform(normalizeInviteCode)
  .refine(isInviteCodeShapeValid, de.connect.errorInvalid);

export const patientInviteSchema = z.object({
  patientDisplayName: z
    .string()
    .trim()
    .min(2, "Bitte geben Sie den Namen des Patienten ein.")
    .max(200, "Der Name ist zu lang."),
  replaceInviteId: z.uuid().optional(),
});

