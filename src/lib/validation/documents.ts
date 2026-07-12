import { z } from "zod";

export const documentMetadataSchema = z.object({
  patientId: z.uuid(),
  title: z.string().trim().min(2, "Bitte geben Sie einen Titel ein.").max(200),
  category: z.enum(["prescription", "finding", "patient_record", "therapy_report", "other"]),
  documentDate: z.preprocess(
    (value) => (typeof value === "string" && value ? value : undefined),
    z.iso.date().optional()
  ),
  note: z.string().trim().max(1000),
});

export const archiveDocumentSchema = z.object({ patientId: z.uuid(), documentId: z.uuid() });

export const deleteDocumentSchema = z.object({
  patientId: z.uuid(),
  documentId: z.uuid(),
  confirm: z.literal("delete", "Bitte bestätigen Sie das endgültige Löschen."),
});

export const internalProfileSchema = z.object({
  patientId: z.uuid(),
  content: z
    .string()
    .trim()
    .max(2000, "Das Kurzprofil darf höchstens 2000 Zeichen lang sein."),
});

