import "server-only";

import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import {
  AVATAR_MIME_TYPES,
  PATIENT_AVATAR_BUCKET,
  extensionFor,
  isAllowedAvatarSize,
  signatureMatches,
  storagePathBelongsToProfile,
} from "@/config/media";
import { isMalwareScanEnabled, scanBufferForMalware } from "@/server/services/malware-scan";

/**
 * Profilbilder von Patienten: gleicher ticket-basierter Ablauf wie die
 * Übungsmedien (D-034). Der Server vergibt einen zufälligen Pfad im
 * eigenen Profilordner, der Browser lädt direkt hoch, und erst die
 * Finalisierung – nach Größen- und Magic-Byte-Prüfung – setzt
 * `profiles.avatar_path` über den Service-Client (die Spalte ist für
 * Clients nicht beschreibbar). Ersetzte oder verworfene Objekte werden
 * entfernt.
 */

const AVATAR_URL_SECONDS = 5 * 60;

export type AvatarUploadTicket = { storagePath: string; signedUrl: string };

export async function createAvatarUploadTicket(
  profileId: string,
  mimeType: string,
  declaredBytes: number
): Promise<AvatarUploadTicket | { error: string }> {
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(mimeType)) {
    return { error: "Dieser Dateityp wird nicht unterstützt." };
  }
  if (!isAllowedAvatarSize(declaredBytes)) {
    return { error: "Die Datei überschreitet das Größenlimit." };
  }
  const storagePath = `${profileId}/${randomUUID()}.${extensionFor(mimeType)}`;
  const service = createSupabaseServiceClient();
  const { data, error } = await service.storage
    .from(PATIENT_AVATAR_BUCKET)
    .createSignedUploadUrl(storagePath);
  if (error || !data) return { error: "Der Upload konnte nicht vorbereitet werden." };
  return { storagePath, signedUrl: data.signedUrl };
}

async function removeStorageObject(storagePath: string) {
  const service = createSupabaseServiceClient();
  await service.storage.from(PATIENT_AVATAR_BUCKET).remove([storagePath]);
}

/** Räumt ein hochgeladenes, aber nicht finalisiertes Objekt auf. */
export async function discardAvatarUpload(profileId: string, storagePath: string) {
  if (!storagePathBelongsToProfile(storagePath, profileId)) return;
  await removeStorageObject(storagePath);
}

async function auditAvatar(actorId: string, eventType: string) {
  const service = createSupabaseServiceClient();
  await service.from("audit_events").insert({
    actor_profile_id: actorId,
    event_type: eventType,
    entity_type: "profile",
    entity_id: actorId,
    metadata: {},
  });
}

export async function finalizeAvatarUpload(
  profileId: string,
  mimeType: string,
  storagePath: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(mimeType)) {
    await discardAvatarUpload(profileId, storagePath);
    return { ok: false, error: "Dieser Dateityp wird nicht unterstützt." };
  }
  if (!storagePathBelongsToProfile(storagePath, profileId)) {
    return { ok: false, error: "Ungültiger Speicherpfad." };
  }
  const service = createSupabaseServiceClient();
  const bucket = service.storage.from(PATIENT_AVATAR_BUCKET);

  const { data: info, error: infoError } = await bucket.info(storagePath);
  if (infoError || !info) return { ok: false, error: "Die Datei wurde nicht gefunden." };
  if (!isAllowedAvatarSize(info.size ?? 0)) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Die Datei überschreitet das Größenlimit." };
  }

  const { data: signed } = await bucket.createSignedUrl(storagePath, 60);
  if (!signed) return { ok: false, error: "Die Datei konnte nicht geprüft werden." };
  const scanEnabled = isMalwareScanEnabled();
  // Ohne Malware-Scan reicht ein Range auf die ersten Bytes (schnell,
  // wenig Datenvolumen). Mit Scan wird die volle Datei gebraucht, da
  // ClamAV den gesamten Inhalt prüfen muss – dann wird das Range-Fetch
  // durch einen vollständigen Download ersetzt. Ein abgebrochener
  // Body-Reader kehrt im Next-Server nie zurück (D-052), daher wird die
  // Antwort in beiden Fällen vollständig gelesen.
  const headResponse = await fetch(
    signed.signedUrl,
    scanEnabled ? undefined : { headers: { Range: "bytes=0-15" } }
  );
  if (!headResponse.ok) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Die Datei konnte nicht geprüft werden." };
  }
  const fullBody = new Uint8Array(await headResponse.arrayBuffer());
  const header = fullBody.slice(0, 16);
  if (!signatureMatches(mimeType, header)) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Dateiinhalt und Dateityp stimmen nicht überein." };
  }
  if (scanEnabled) {
    const scanResult = await scanBufferForMalware(fullBody);
    if (!scanResult.clean) {
      await removeStorageObject(storagePath);
      return { ok: false, error: "Die Datei konnte nicht sicher gespeichert werden." };
    }
  }

  const { data: profile } = await service
    .from("profiles")
    .select("avatar_path")
    .eq("id", profileId)
    .maybeSingle();
  const previousPath = profile?.avatar_path ?? null;

  const { error: updateError } = await service
    .from("profiles")
    .update({ avatar_path: storagePath })
    .eq("id", profileId);
  if (updateError) {
    await removeStorageObject(storagePath);
    return { ok: false, error: "Das Profilbild konnte nicht gespeichert werden." };
  }
  if (previousPath && previousPath !== storagePath) {
    await removeStorageObject(previousPath);
  }
  await auditAvatar(profileId, "patient_avatar_updated");
  return { ok: true };
}

export async function removeOwnAvatar(
  profileId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createSupabaseServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("avatar_path")
    .eq("id", profileId)
    .maybeSingle();
  const currentPath = profile?.avatar_path ?? null;

  const { error } = await service
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", profileId);
  if (error) return { ok: false, error: "Das Profilbild konnte nicht entfernt werden." };
  if (currentPath && storagePathBelongsToProfile(currentPath, profileId)) {
    await removeStorageObject(currentPath);
  }
  await auditAvatar(profileId, "patient_avatar_removed");
  return { ok: true };
}

/**
 * Kurzlebige signierte URL für das EIGENE Profilbild. Der Pfad wird
 * gegen den eigenen Profilordner geprüft, bevor signiert wird.
 */
export async function getOwnAvatarUrl(profileId: string): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", profileId)
    .maybeSingle();
  return signAvatarPath(profileId, data?.avatar_path ?? null);
}

/**
 * Signiert einen Avatar-Pfad für einen bestimmten Patienten. Die
 * Autorisierung (eigenes Profil bzw. aktive Praxisverbindung) muss der
 * Aufrufer VORHER sicherstellen; die Pfadprüfung verhindert zusätzlich,
 * dass ein manipulierter avatar_path auf fremde Objekte zeigt.
 */
export async function signAvatarPath(
  patientProfileId: string,
  avatarPath: string | null
): Promise<string | null> {
  if (!avatarPath) return null;
  if (!storagePathBelongsToProfile(avatarPath, patientProfileId)) return null;
  const service = createSupabaseServiceClient();
  const { data } = await service.storage
    .from(PATIENT_AVATAR_BUCKET)
    .createSignedUrl(avatarPath, AVATAR_URL_SECONDS);
  return data?.signedUrl ?? null;
}
