import { z } from "zod";

const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value ? value : undefined),
  z.iso.date().optional()
);

export const createAuthorizationSchema = z.object({
  patientId: z.uuid(),
  title: z.string().trim().min(2, "Bitte geben Sie eine Bezeichnung ein.").max(200),
  reference: z.string().trim().max(200),
  prescribedSessions: z.coerce.number().int().min(1).max(500),
  issuedOn: z.iso.date(),
  validFrom: optionalDate,
  validUntil: optionalDate,
  prescribingDoctor: z.string().trim().max(200),
  note: z.string().trim().max(1000),
}).refine(
  (value) => !value.validFrom || !value.validUntil || value.validUntil >= value.validFrom,
  { message: "Das Enddatum darf nicht vor dem Startdatum liegen." }
);

export const adjustAuthorizationSchema = z.object({
  authorizationId: z.uuid(),
  patientId: z.uuid(),
  sessionDelta: z.coerce.number().int().min(-500).max(500).refine((value) => value !== 0, "Die Änderung darf nicht 0 sein."),
  reason: z.string().trim().min(3, "Bitte geben Sie einen kurzen Grund an.").max(500),
});

export const archiveAuthorizationSchema = z.object({
  authorizationId: z.uuid(),
  patientId: z.uuid(),
});

