import { z } from "zod";

const timeValueSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Bitte geben Sie eine gültige Uhrzeit ein.");

export const reminderPreferencesSchema = z.object({
  exerciseRemindersEnabled: z.boolean(),
  planUpdatesEnabled: z.boolean(),
  quietStart: timeValueSchema,
  quietEnd: timeValueSchema,
});

export const notificationIdSchema = z.uuid();

