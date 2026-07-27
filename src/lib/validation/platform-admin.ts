import { z } from "zod";
import { CALENDAR_COLORS } from "@/lib/calendar-colors";
import { appointmentDurationsMinutes } from "@/lib/validation/appointments";
import { emailSchema } from "@/lib/validation/auth";
import { branding } from "@/config/branding";

/**
 * Validierung aller Betreiber- und Praxis-Konfigurationswege. Bewusst
 * getrennt von den bestehenden Praxis-Schreibwegen: das Betreiberportal
 * und die Praxis-Selbstverwaltung teilen sich diese Schemas, aber
 * jeder Schreibpfad prüft die passende Autorisierung separat
 * (is_platform_admin() bzw. is_practice_admin()).
 */

const nameSchema = z
  .string()
  .trim()
  .min(1, "Bitte geben Sie einen Namen ein.")
  .max(200, "Der Name ist zu lang (maximal 200 Zeichen).");

const ianaTimezoneSchema = z
  .string()
  .trim()
  .min(1, "Bitte wählen Sie eine Zeitzone.")
  .max(80, "Die Zeitzone ist ungültig.");

const localeSchema = z.enum(["de"], "Bitte wählen Sie eine unterstützte Sprache.");

const optionalUrlSchema = z
  .string()
  .trim()
  .max(300, "Die URL ist zu lang (maximal 300 Zeichen).")
  .refine((value) => value === "" || /^https?:\/\//.test(value), {
    message: "Bitte geben Sie eine vollständige URL an (http:// oder https://).",
  })
  .optional()
  .default("");

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(40, "Die Telefonnummer ist zu lang (maximal 40 Zeichen).")
  .optional()
  .default("");

const optionalTextSchema = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Der Text ist zu lang (maximal ${max} Zeichen).`)
    .optional()
    .default("");

/** Phase C: Praxis-Stammdaten beim Onboarding durch den Betreiber. */
export const practiceOnboardingSchema = z.object({
  name: nameSchema,
  addressStreet: optionalTextSchema(200),
  addressPostalCode: optionalTextSchema(20),
  addressCity: optionalTextSchema(120),
  country: optionalTextSchema(80),
  timezone: ianaTimezoneSchema.default(branding.defaultTimeZone),
  locale: localeSchema.default("de"),
  phone: optionalPhoneSchema,
  supportEmail: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    })
    .optional()
    .default(""),
  website: optionalUrlSchema,
  status: z.enum(["trial", "active"]).default("trial"),
  trialEndsAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Bitte wählen Sie ein gültiges Datum.")
    .optional()
    .or(z.literal("")),
  adminName: nameSchema,
  adminEmail: emailSchema,
});

export type PracticeOnboardingInput = z.infer<typeof practiceOnboardingSchema>;

/** Praxis-Stammdaten (Selbstverwaltung durch Praxisadmin ODER Betreiber). */
export const practiceProfileSchema = z.object({
  name: nameSchema,
  addressStreet: optionalTextSchema(200),
  addressPostalCode: optionalTextSchema(20),
  addressCity: optionalTextSchema(120),
  phone: optionalPhoneSchema,
  timezone: ianaTimezoneSchema,
  supportEmail: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    })
    .optional()
    .default(""),
  supportUrl: optionalUrlSchema,
});

export type PracticeProfileInput = z.infer<typeof practiceProfileSchema>;

/** Nur der Betreiber ändert den Lebenszyklus (Status/Trial/interne Notiz). */
export const practiceLifecycleSchema = z.object({
  status: z.enum(["trial", "active", "suspended", "archived"]),
  trialEndsAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  internalNote: optionalTextSchema(1000),
});

export type PracticeLifecycleInput = z.infer<typeof practiceLifecycleSchema>;

/** Praxis-Einstellungen (validiertes JSON in practices.settings). */
export const practiceSettingsSchema = z.object({
  defaultAppointmentDurationMinutes: z
    .union(appointmentDurationsMinutes.map((value) => z.literal(value)))
    .default(30),
  cancellationNoticeHours: z.coerce
    .number()
    .int()
    .min(0, "Die Frist darf nicht negativ sein.")
    .max(168, "Die Frist ist zu lang (maximal 168 Stunden / 7 Tage).")
    .default(24),
  cancellationNoticeText: optionalTextSchema(300),
  lowSessionsThreshold: z.coerce
    .number()
    .int()
    .min(1, "Die Schwelle muss mindestens 1 sein.")
    .max(20, "Die Schwelle ist zu hoch (maximal 20).")
    .default(2),
  patientSafetyText: optionalTextSchema(500),
  accentColor: z.enum(CALENDAR_COLORS).default("teal"),
  defaultReminders: z
    .object({
      exerciseRemindersEnabled: z.boolean().default(true),
      planUpdatesEnabled: z.boolean().default(true),
      quietStart: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .default("21:00"),
      quietEnd: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
        .default("07:00"),
    })
    .default({
      exerciseRemindersEnabled: true,
      planUpdatesEnabled: true,
      quietStart: "21:00",
      quietEnd: "07:00",
    }),
  featureOverrides: z.record(z.string(), z.boolean()).default({}),
});

export type PracticeSettings = z.infer<typeof practiceSettingsSchema>;

export const defaultPracticeSettings: PracticeSettings = practiceSettingsSchema.parse({});

/** Sicherheitsobergrenze, unabhängig von jedem UI-Eingabewert. */
export const MAX_UPLOAD_MB_CEILING = 25;

/** Global bekannte, im Betreiberportal umschaltbare Funktions-Flags. */
export const FEATURE_FLAG_KEYS = ["practiceAccentColor"] as const;
export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

const featureFlagEntrySchema = z.object({
  enabled: z.boolean(),
  defaultForNewPractices: z.boolean(),
});

export const featureFlagsSchema = z.record(z.enum(FEATURE_FLAG_KEYS), featureFlagEntrySchema);
export type FeatureFlags = z.infer<typeof featureFlagsSchema>;

export const defaultFeatureFlags: FeatureFlags = {
  practiceAccentColor: { enabled: true, defaultForNewPractices: true },
};

/** Globale Plattformkonfiguration (Betreiber, `platform_config`). */
export const platformConfigSchema = z.object({
  productName: nameSchema.default(branding.appName),
  supportEmail: z
    .string()
    .trim()
    .max(200)
    .refine((value) => value === "" || z.email().safeParse(value).success, {
      message: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    })
    .optional()
    .default(""),
  supportUrl: optionalUrlSchema,
  privacyUrl: optionalUrlSchema,
  imprintUrl: optionalUrlSchema,
  maintenanceActive: z.boolean().default(false),
  maintenanceMessage: optionalTextSchema(300),
  defaultNewPracticeTimezone: ianaTimezoneSchema.default(branding.defaultTimeZone),
  defaultNewPracticeLocale: localeSchema.default("de"),
  maxUploadMb: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_UPLOAD_MB_CEILING, `Darf die feste Obergrenze von ${MAX_UPLOAD_MB_CEILING} MB nicht überschreiten.`)
    .default(5),
});

export type PlatformConfigInput = z.infer<typeof platformConfigSchema>;

/** Mitarbeitereinladung (Betreiber-Onboarding und Praxis-Selbstverwaltung). */
export const staffInviteSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: z.enum(["admin", "therapist"]),
});

export type StaffInviteInput = z.infer<typeof staffInviteSchema>;

export const memberRoleChangeSchema = z.object({
  memberId: z.uuid(),
  role: z.enum(["admin", "therapist"]),
});

/** Zugangs-Wiederherstellung: Plattformadmin legt die neue E-Mail-Adresse fest (s. D-113). */
export const practiceMemberRecoverySchema = z.object({
  practiceMemberId: z.uuid(),
  newEmail: emailSchema,
});

export const practiceSearchSchema = z.object({
  query: z.string().trim().max(200).optional().default(""),
  status: z.enum(["trial", "active", "suspended", "archived", "all"]).default("all"),
  country: z.string().trim().max(80).optional().default(""),
});
