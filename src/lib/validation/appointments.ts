import { z } from "zod";

/**
 * Validierung aller Termin-Schreibwege (Praxiskalender und
 * Absageanfragen der Patienten). Zeiten kommen als Kalendertag +
 * Uhrzeit + Dauer; die Umrechnung nach UTC passiert serverseitig in
 * der Zeitzone der Praxis.
 */

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte wählen Sie ein gültiges Datum.");

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Bitte wählen Sie eine gültige Uhrzeit.");

export const appointmentDurationsMinutes = [15, 20, 30, 45, 60, 90, 120] as const;

const appointmentFields = z.object({
  patientProfileId: z.uuid("Bitte wählen Sie einen Patienten aus."),
  therapistMemberId: z.uuid("Bitte wählen Sie eine behandelnde Person aus."),
  date: isoDateSchema,
  startTime: timeSchema,
  durationMinutes: z.coerce
    .number()
    .int()
    .min(5, "Die Dauer ist zu kurz (mindestens 5 Minuten).")
    .max(480, "Die Dauer ist zu lang (maximal 8 Stunden)."),
  locationName: z
    .string()
    .trim()
    .max(200, "Der Standort ist zu lang (maximal 200 Zeichen).")
    .optional()
    .default(""),
  note: z
    .string()
    .trim()
    .max(500, "Die Notiz ist zu lang (maximal 500 Zeichen).")
    .optional()
    .default(""),
});

export const createAppointmentSchema = appointmentFields;

export const updateAppointmentSchema = appointmentFields.extend({
  appointmentId: z.uuid(),
});

const neutralReason = z
  .string()
  .trim()
  .max(300, "Der Grund ist zu lang (maximal 300 Zeichen).")
  .optional()
  .default("");

export const cancelAppointmentSchema = z.object({
  appointmentId: z.uuid(),
  reason: neutralReason,
});

export const completeAppointmentSchema = z.object({
  appointmentId: z.uuid(),
});

export const requestCancellationSchema = z.object({
  appointmentId: z.uuid(),
  reason: neutralReason,
});

export const decideCancellationSchema = z.object({
  requestId: z.uuid(),
  decision: z.enum(["approve", "decline"]),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
