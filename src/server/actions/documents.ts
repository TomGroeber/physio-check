"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { getSessionContext } from "@/server/services/session";
import { getPatientDetail } from "@/server/services/practice";
import { auditDocument, getPracticeDocument, removePatientDocumentFile } from "@/server/services/documents";
import {
  archiveDocumentSchema,
  deleteDocumentSchema,
  documentMetadataSchema,
  internalProfileSchema,
} from "@/lib/validation/documents";

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

/**
 * Endgültiges Löschen: nur für bereits archivierte Dokumente (Zwei-Schritt-
 * Sicherheit, auch per RLS-Policy erzwungen). Erst die Datenbankzeile über
 * die Nutzerrechte löschen, dann die Datei aus dem privaten Bucket.
 */
export async function deletePatientDocumentAction(
  _state: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const parsed = deleteDocumentSchema.safeParse({
    patientId: formData.get("patientId"),
    documentId: formData.get("documentId"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await authorizedContext(parsed.data.patientId);
  if (!context) return { error: "Kein Zugriff auf diesen Patienten." };
  const document = await getPracticeDocument(
    context.membership.practiceId,
    parsed.data.patientId,
    parsed.data.documentId
  );
  if (!document) return { error: "Dokument nicht gefunden." };
  if (!document.archived_at) {
    return { error: "Nur archivierte Dokumente können endgültig gelöscht werden." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: deleted, error } = await supabase
    .from("patient_documents")
    .delete()
    .eq("id", document.id)
    .select("id");
  if (error || !deleted?.length) return { error: "Das Dokument konnte nicht gelöscht werden." };
  await removePatientDocumentFile(document.storage_path);
  await auditDocument(context.session.userId, context.membership.practiceId, document.id, "patient_document_deleted");
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  return { success: "Das Dokument wurde endgültig gelöscht." };
}

/**
 * Internes Kurzprofil speichern (Upsert pro Praxis+Patient). Inhalt ist
 * für Patienten unsichtbar (eigene Tabelle ohne Patienten-Policy).
 */
export async function savePatientInternalProfileAction(
  _state: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const parsed = internalProfileSchema.safeParse({
    patientId: formData.get("patientId"),
    content: formData.get("content"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await authorizedContext(parsed.data.patientId);
  if (!context) return { error: "Kein Zugriff auf diesen Patienten." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("patient_internal_profiles").upsert(
    {
      practice_id: context.membership.practiceId,
      patient_profile_id: parsed.data.patientId,
      content: parsed.data.content,
      updated_by: context.membership.memberId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "practice_id,patient_profile_id" }
  );
  if (error) return { error: "Das Kurzprofil konnte nicht gespeichert werden." };
  revalidatePath(`/practice/patients/${parsed.data.patientId}`);
  return { success: "Das Kurzprofil wurde gespeichert." };
}

