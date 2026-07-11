"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { getSessionContext } from "@/server/services/session";
import { getPatientDetail } from "@/server/services/practice";
import { auditDocument, getPracticeDocument } from "@/server/services/documents";
import { archiveDocumentSchema, documentMetadataSchema } from "@/lib/validation/documents";

export type DocumentActionState = { error?: string; success?: string };
const MAX_SIZE = 20 * 1024 * 1024;
const FILE_TYPES = {
  "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
} as const;

async function authorizedContext(patientId: string) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  const patient = await getPatientDetail(membership.practiceId, patientId);
  return patient ? { session, membership } : null;
}

function signatureMatches(bytes: Uint8Array, expected: readonly number[]) {
  return expected.every((value, index) => bytes[index] === value);
}

export async function uploadPatientDocumentAction(
  _state: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const parsed = documentMetadataSchema.safeParse({
    patientId: formData.get("patientId"),
    title: formData.get("title"),
    category: formData.get("category"),
    documentDate: formData.get("documentDate"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Bitte wählen Sie eine Datei aus." };
  if (file.size > MAX_SIZE) return { error: "Die Datei ist größer als 20 MB." };
  const fileType = FILE_TYPES[file.type as keyof typeof FILE_TYPES];
  if (!fileType) return { error: "Erlaubt sind PDF-, JPEG- und PNG-Dateien." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureMatches(bytes, fileType.signature)) {
    return { error: "Dateiinhalt und Dateityp stimmen nicht überein." };
  }
  const context = await authorizedContext(parsed.data.patientId);
  if (!context) return { error: "Kein Zugriff auf diesen Patienten." };

  const storagePath = `${context.membership.practiceId}/${parsed.data.patientId}/${randomUUID()}.${fileType.extension}`;
  const service = createSupabaseServiceClient();
  const { error: uploadError } = await service.storage
    .from("patient-records")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "Die Datei konnte nicht hochgeladen werden." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patient_documents")
    .insert({
      practice_id: context.membership.practiceId,
      patient_profile_id: parsed.data.patientId,
      title: parsed.data.title,
      category: parsed.data.category,
      document_date: parsed.data.documentDate ?? null,
      note: parsed.data.note,
      storage_path: storagePath,
      original_name: file.name.slice(0, 255),
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: context.membership.memberId,
    })
    .select("id")
    .single();
  if (error || !data) {
    await service.storage.from("patient-records").remove([storagePath]);
    return { error: "Die Dokumentinformationen konnten nicht gespeichert werden." };
  }
  await auditDocument(context.session.userId, context.membership.practiceId, data.id, "patient_document_uploaded");
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  return { success: "Dokument sicher hochgeladen." };
}

export async function archivePatientDocumentAction(formData: FormData): Promise<void> {
  const parsed = archiveDocumentSchema.safeParse({
    patientId: formData.get("patientId"),
    documentId: formData.get("documentId"),
  });
  if (!parsed.success) return;
  const context = await authorizedContext(parsed.data.patientId);
  if (!context) return;
  const document = await getPracticeDocument(
    context.membership.practiceId,
    parsed.data.patientId,
    parsed.data.documentId
  );
  if (!document) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("patient_documents").update({ archived_at: new Date().toISOString() }).eq("id", document.id);
  await auditDocument(context.session.userId, context.membership.practiceId, document.id, "patient_document_archived");
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
}

