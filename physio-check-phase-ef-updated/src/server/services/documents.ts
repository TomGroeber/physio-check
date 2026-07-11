import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";

export async function listPatientDocuments(practiceId: string, patientId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("patient_documents")
    .select("id, title, category, document_date, note, original_name, mime_type, size_bytes, archived_at, created_at")
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Dokumente konnten nicht geladen werden.");
  return data ?? [];
}

export async function getPracticeDocument(practiceId: string, patientId: string, documentId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("patient_documents")
    .select("id, storage_path, original_name, mime_type, archived_at")
    .eq("id", documentId)
    .eq("practice_id", practiceId)
    .eq("patient_profile_id", patientId)
    .maybeSingle();
  return data;
}

export async function createPatientDocumentSignedUrl(storagePath: string) {
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage.from("patient-records").createSignedUrl(storagePath, 60);
  if (error) throw new Error("Die Datei konnte nicht geöffnet werden.");
  return data.signedUrl;
}

export async function auditDocument(actorId: string, practiceId: string, documentId: string, eventType: string) {
  const service = createSupabaseServiceClient();
  await service.from("audit_events").insert({
    actor_profile_id: actorId,
    practice_id: practiceId,
    event_type: eventType,
    entity_type: "patient_document",
    entity_id: documentId,
    metadata: {},
  });
}

