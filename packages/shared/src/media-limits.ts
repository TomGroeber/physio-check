/**
 * Profilbild-Limits, von Website und nativer App gemeinsam genutzt
 * (vorher an beiden Stellen wortgleich dupliziert). Serverseitige
 * Prüfung bleibt in src/config/media.ts (u. a. Speicherpfad-/Signatur-
 * prüfung) – hier nur die reinen, auf beiden Plattformen benötigten
 * Werte.
 */

/** Maximale Profilbildgröße in Megabyte. */
export const MAX_AVATAR_MB = 5;
export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isAllowedAvatarSize(bytes: number): boolean {
  return Number.isInteger(bytes) && bytes > 0 && bytes <= MAX_AVATAR_MB * 1024 * 1024;
}
