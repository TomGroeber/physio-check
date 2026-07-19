import { z } from "zod";

/**
 * Validierung für Kontaktdaten. Die Telefonnummer
 * ist bewusst optional (Datenminimierung) und formatoffen: Ziffern,
 * Leerzeichen und übliche Zeichen (+ ( ) / . -), maximal 30 Zeichen.
 */

export const phoneSchema = z
  .string()
  .trim()
  .max(30, "Die Telefonnummer ist zu lang (maximal 30 Zeichen).")
  .regex(
    /^[0-9+()/.\s-]*$/,
    "Die Telefonnummer darf nur Ziffern, Leerzeichen und + ( ) / . - enthalten."
  )
  .refine(
    (value) => value === "" || (value.match(/\d/g)?.length ?? 0) >= 3,
    "Die Telefonnummer ist zu kurz."
  )
  .optional()
  .default("");

export const updateOwnPhoneSchema = z.object({
  phone: phoneSchema,
});

export const updatePatientPhoneSchema = z.object({
  patientId: z.uuid("Ungültiger Patient."),
  phone: phoneSchema,
});
