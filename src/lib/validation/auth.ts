import { z } from "zod";
import { de } from "@/messages/de";

/**
 * Zod-Schemas für alle Auth-Formulare. Gleiche Schemas werden im
 * Browser (Formular-Feedback) und serverseitig (verbindliche
 * Validierung) verwendet.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, de.common.requiredField)
  .email("Bitte geben Sie eine gültige E-Mail-Adresse ein.");

export const passwordSchema = z
  .string()
  .min(10, de.auth.register.errorWeakPassword)
  .max(200, "Das Passwort ist zu lang (maximal 200 Zeichen).");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, de.common.requiredField),
});

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Bitte geben Sie Ihren Vor- und Nachnamen ein.")
  .max(200, "Der Name ist zu lang.");

/**
 * Checkbox-Felder kommen aus FormData nur als "on" (angehakt) oder
 * gar nicht (String "null" bei uncontrolled fehlt der Key komplett,
 * formData.get liefert dann null). preprocess normalisiert das zu
 * einem Bool, bevor literal(true) prüft.
 */
export const consentSchema = z.preprocess(
  (value) => value === "on",
  z.literal(true, de.auth.register.errorConsentRequired)
);

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  consent: consentSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Neue E-Mail-Adresse für die Kontoänderung: getrimmt und normalisiert
 * (Kleinschreibung), damit Vergleiche und Supabase-Aufrufe eindeutig sind.
 */
export const changeEmailSchema = z.object({
  email: emailSchema.transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
