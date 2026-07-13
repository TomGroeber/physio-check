import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import {
  EXERCISE_MEDIA_BUCKET,
  allowedMimeTypes,
  extensionFor,
  maxBytes,
  signatureMatches,
  storagePathBelongsToExercise,
  type UploadableMediaKind,
} from "@/config/media";

/**
 * Übungsmedien: Ticket-basierter Upload in den privaten Bucket
 * `exercise-media`. Der Server vergibt einen zufälligen Pfad unterhalb
 * der Praxis (Ordner = practice_id, passend zu den Storage-Policies),
 * der Browser lädt direkt hoch (Fortschritt), und erst die
 * Finalisierung – nach serverseitiger Signatur- und Größenprüfung –
 * macht die Datei über eine exercise_media-Zeile erreichbar. Nicht
 * finalisierte oder ersetzte Objekte werden entfernt.
 */

const PREVIEW_URL_SECONDS = 10 * 60;

export type UploadTicket = {
  storagePath: string;
  signedUrl: string;
};

export async function createUploadTicket(
  practiceId: string,
  exerciseId: string,
  kind: UploadableMediaKind,
  mimeType: string,
  declaredBytes: number
): Promise<UploadTicket | { error: string }> {
  if (!allowedMimeTypes(kind).includes(mimeType)) {
    return { error: "Dieser Dateityp wird nicht unterstützt." };
  }
  if (declaredBytes <= 0 || declaredBytes > maxBytes(kind)) {
    return { error: "Die Datei überschreitet das Größenlimit." };
  }
  const storagePath = `${practiceId}/${exerciseId}/${randomUUID()}.${extensionFor(mimeType)}`;
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from(EXERCISE_MEDIA_BUCKET)
    .createSignedUploadUrl(storagePath);
  if (error || !data) return { error: "Der Upload konnte nicht vorbereitet werden." };
  return { storagePath, signedUrl: data.signedUrl };
}

async function removeStorageObject(storagePath: string) {
  const service = createSupabaseServiceClient();
  await service.storage.from(EXERCISE_MEDIA_BUCKET).remove([storagePath]);
}

/** Räumt ein hochgeladenes, aber nicht finalisiertes Objekt auf. */
export async function discardUpload(
  practiceId: string,
  exerciseId: string,
  storagePath: string
) {
  if (!storagePathBelongsToExercise(storagePath, practiceId, exerciseId)) return;
  await removeStorageObject(storagePath);
}

/**
 * Prüft die hochgeladene Datei serverseitig (Existenz, Größe, Magic
 * Bytes) und registriert sie. Ein vorhandenes Medium derselben Art wird
 * ersetzt: Zeile gelöscht und Storage-Objekt entfernt – ersetzte Videos
 * sind damit nicht mehr zugänglich.
 */
export async function finalizeUpload(
  practiceId: string,
  exerciseId: string,
  kind: UploadableMediaKind,
  mimeType: string,
  storagePath: string
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  if (!allowedMimeTypes(kind).includes(mimeType)) {
    await discardUpload(practiceId, exerciseId, storagePath);
    return { ok: false, error: "Dieser Dateityp wird nicht unterstützt." };
  }
  if (!storagePathBelongsToExercise(storagePath, practiceId, exerciseId)) {
    return { ok: false, error: "Ungültiger Speicherpfad." };
  }
  const service = createSupabaseServiceClient();
  const bucket = service.storage.from(EXERCISE_MEDIA_BUCKET);

  const { data: info, error: infoError } = await bucket.info(storagePath);
  if (infoError || !info) return { ok: false, error: "Die Datei wurde nicht gefunden." };
  const size = info.size ?? 0;
  if (size <= 0 || size > maxBytes(kind)) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Die Datei überschreitet das Größenlimit." };
  }

  const { data: signed } = await bucket.createSignedUrl(storagePath, 60);
  if (!signed) return { ok: false, error: "Die Datei konnte nicht geprüft werden." };
  const headResponse = await fetch(signed.signedUrl, {
    headers: { Range: "bytes=0-15" },
  });
  if (!headResponse.ok || !headResponse.body) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Die Datei konnte nicht geprüft werden." };
  }
  const reader = headResponse.body.getReader();
  const firstChunk = await reader.read();
  await reader.cancel();
  const header = firstChunk.value?.slice(0, 16) ?? new Uint8Array();
  if (!signatureMatches(mimeType, header)) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Dateiinhalt und Dateityp stimmen nicht überein." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("exercise_media")
    .select("id, storage_path")
    .eq("exercise_id", exerciseId)
    .eq("kind", kind)
    .maybeSingle();
  const { data: saved, error: insertError } = await supabase
    .from("exercise_media")
    .upsert(
      {
        exercise_id: exerciseId,
        kind,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: size,
        created_at: new Date().toISOString(),
      },
      { onConflict: "exercise_id,kind" }
    )
    .select("id")
    .single();
  if (insertError || !saved) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Das Medium konnte nicht gespeichert werden." };
  }
  if (existing && existing.storage_path !== storagePath) {
    await removeStorageObject(existing.storage_path);
  }
  return { ok: true, mediaId: saved.id };
}

export async function removeMedia(
  practiceId: string,
  exerciseId: string,
  mediaId: string
): Promise<{ ok: true; mediaId: string } | { ok: false; error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("exercise_media")
    .select("id, storage_path, exercise_id")
    .eq("id", mediaId)
    .eq("exercise_id", exerciseId)
    .maybeSingle();
  if (!row || !storagePathBelongsToExercise(row.storage_path, practiceId, exerciseId)) {
    return { ok: false, error: "Medium nicht gefunden." };
  }
  const { error } = await supabase.from("exercise_media").delete().eq("id", row.id);
  if (error) return { ok: false, error: "Das Medium konnte nicht entfernt werden." };
  await removeStorageObject(row.storage_path);
  return { ok: true, mediaId: row.id };
}

/** Kurzlebige Vorschau-URLs für die Praxis (nach Mitgliedschaftsprüfung im Aufrufer). */
export async function getMediaPreviewUrls(exerciseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: media } = await supabase
    .from("exercise_media")
    .select("id, kind, mime_type, size_bytes, storage_path")
    .eq("exercise_id", exerciseId);
  if (!media?.length) return [];
  const service = createSupabaseServiceClient();
  const bucket = service.storage.from(EXERCISE_MEDIA_BUCKET);
  return Promise.all(
    media.map(async (row) => {
      const { data } = await bucket.createSignedUrl(row.storage_path, PREVIEW_URL_SECONDS);
      return {
        id: row.id,
        kind: row.kind,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        url: data?.signedUrl ?? null,
      };
    })
  );
}

export async function auditExerciseMedia(
  actorId: string,
  practiceId: string,
  exerciseId: string,
  eventType: string
) {
  const service = createSupabaseServiceClient();
  await service.from("audit_events").insert({
    actor_profile_id: actorId,
    practice_id: practiceId,
    event_type: eventType,
    entity_type: "exercise_media",
    entity_id: exerciseId,
    metadata: {},
  });
}
