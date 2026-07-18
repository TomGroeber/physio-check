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

export const registerSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
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
