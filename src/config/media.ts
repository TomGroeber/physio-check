/**
 * Konfiguration für Übungsmedien. Limits bewusst zentral und ohne
 * Hartkodierung in Komponenten; bei Bedarf hier anpassen.
 */

export const EXERCISE_MEDIA_BUCKET = "exercise-media";
export const PATIENT_AVATAR_BUCKET = "patient-avatars";

/** Maximale Profilbildgröße in Megabyte. */
export const MAX_AVATAR_MB = 5;
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isAllowedAvatarSize(bytes: number): boolean {
  return Number.isInteger(bytes) && bytes > 0 && bytes <= MAX_AVATAR_MB * 1024 * 1024;
}

/**
 * Prüft, dass ein Avatar-Objektpfad exakt in den eigenen Profilordner
 * zeigt (`<profile_id>/<datei>` ohne weitere Verzeichnisebenen).
 */
export function storagePathBelongsToProfile(
  storagePath: string,
  profileId: string
): boolean {
  const prefix = `${profileId}/`;
  const fileName = storagePath.slice(prefix.length);
  return (
    storagePath.startsWith(prefix) &&
    fileName.length > 0 &&
    !fileName.includes("/") &&
    !fileName.includes("\\")
  );
}

/** Maximale Videogröße in Megabyte. */
export const MAX_VIDEO_MB = 100;
/** Maximale Bildgröße (Vorschau-/Alternativbild) in Megabyte. */
export const MAX_IMAGE_MB = 5;
/** Maximale Untertitelgröße in Kilobyte. */
export const MAX_CAPTIONS_KB = 512;

export const VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export const CAPTIONS_MIME_TYPES = ["text/vtt"] as const;

export type UploadableMediaKind =
  | "video"
  | "thumbnail"
  | "fallback_image"
  | "captions";

export function allowedMimeTypes(kind: UploadableMediaKind): readonly string[] {
  if (kind === "video") return VIDEO_MIME_TYPES;
  if (kind === "captions") return CAPTIONS_MIME_TYPES;
  return IMAGE_MIME_TYPES;
}

export function maxBytes(kind: UploadableMediaKind): number {
  if (kind === "video") return MAX_VIDEO_MB * 1024 * 1024;
  if (kind === "captions") return MAX_CAPTIONS_KB * 1024;
  return MAX_IMAGE_MB * 1024 * 1024;
}

export function isAllowedMediaSize(kind: UploadableMediaKind, bytes: number): boolean {
  return Number.isInteger(bytes) && bytes > 0 && bytes <= maxBytes(kind);
}

export function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "text/vtt":
      return "vtt";
    default:
      return "bin";
  }
}

/**
 * Prüft die Dateisignatur (Magic Bytes) gegen den deklarierten Typ.
 * MP4: "ftyp" ab Byte 4 · WebM/Matroska: 1A 45 DF A3 ·
 * JPEG: FF D8 FF · PNG: 89 50 4E 47 · WebVTT: optionales
 * UTF-8-BOM gefolgt von "WEBVTT".
 */
export function signatureMatches(mimeType: string, bytes: Uint8Array): boolean {
  const startsWith = (expected: number[], offset = 0) =>
    expected.every((value, index) => bytes[offset + index] === value);
  switch (mimeType) {
    case "video/mp4":
      return startsWith([0x66, 0x74, 0x79, 0x70], 4);
    case "video/webm":
      return startsWith([0x1a, 0x45, 0xdf, 0xa3]);
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47]);
    case "image/webp":
      // RIFF-Container: "RIFF" ab Byte 0, "WEBP" ab Byte 8.
      return startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8);
    case "text/vtt": {
      const offset = startsWith([0xef, 0xbb, 0xbf]) ? 3 : 0;
      return startsWith([0x57, 0x45, 0x42, 0x56, 0x54, 0x54], offset);
    }
    default:
      return false;
  }
}

/** Verhindert, dass ein manipuliertes Ticket auf einen fremden Objektpfad zeigt. */
export function storagePathBelongsToExercise(
  storagePath: string,
  practiceId: string,
  exerciseId: string
): boolean {
  const prefix = `${practiceId}/${exerciseId}/`;
  const fileName = storagePath.slice(prefix.length);
  return (
    storagePath.startsWith(prefix) &&
    fileName.length > 0 &&
    !fileName.includes("/") &&
    !fileName.includes("\\")
  );
}
