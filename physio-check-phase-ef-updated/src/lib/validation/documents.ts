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

