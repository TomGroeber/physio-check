import { DEFAULT_REMINDER_PREFERENCES } from "@physio-check/shared";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

export type ReminderPreferences = {
  exerciseRemindersEnabled: boolean;
  planUpdatesEnabled: boolean;
  quietStart: string;
  quietEnd: string;
};

export async function getReminderPreferences(
  userId: string
): Promise<ReminderPreferences> {
  const { data, error } = await supabase
    .from("patient_reminder_preferences")
    .select("exercise_reminders_enabled, plan_updates_enabled, quiet_start, quiet_end")
    .eq("profile_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ...DEFAULT_REMINDER_PREFERENCES };
  return {
    exerciseRemindersEnabled: data.exercise_reminders_enabled,
    planUpdatesEnabled: data.plan_updates_enabled,
    quietStart: String(data.quiet_start).slice(0, 5),
    quietEnd: String(data.quiet_end).slice(0, 5),
  };
}

export async function saveReminderPreferences(
  userId: string,
  preferences: ReminderPreferences
): Promise<void> {
  const { error } = await supabase.from("patient_reminder_preferences").upsert(
    {
      profile_id: userId,
      exercise_reminders_enabled: preferences.exerciseRemindersEnabled,
      plan_updates_enabled: preferences.planUpdatesEnabled,
      quiet_start: preferences.quietStart,
      quiet_end: preferences.quietEnd,
    },
    { onConflict: "profile_id" }
  );
  if (error) throw new Error(error.message);
}

/** Eigene Telefonnummer (RLS: Spaltenrecht nur auf eigene Zeile). */
export async function savePhone(userId: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ phone: phone.trim() })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function getProfile(userId: string): Promise<{
  fullName: string;
  phone: string;
  avatarPath: string | null;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_path")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    fullName: data?.full_name ?? "",
    phone: data?.phone ?? "",
    avatarPath: data?.avatar_path ?? null,
  };
}

/**
 * Anzeige des eigenen Profilbilds: Die Storage-Policy erlaubt dem
 * Patienten das eigene Objekt – die signierte URL entsteht direkt,
 * ohne Serverumweg (D-059).
 */
export async function getAvatarUrl(avatarPath: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from("patient-avatars")
    .createSignedUrl(avatarPath, 600);
  return data?.signedUrl ?? null;
}

export type AvatarUploadResult = { signedUrl: string };

/**
 * Upload/Ersetzen/Entfernen laufen über die abgesicherten
 * /api/mobile-Endpunkte (Ticket-Muster mit serverseitiger Signatur-
 * prüfung; direkter Bucket-Schreibzugriff ist bewusst gesperrt).
 */
export async function uploadAvatar(
  fileUri: string,
  mimeType: string
): Promise<AvatarUploadResult> {
  // Bytegröße kommt bewusst vom geladenen Blob, nicht vom Picker-Ergebnis:
  // `ImagePicker`s `fileSize` fehlt bei `allowsEditing: true` nach dem
  // Zuschneiden zuverlässig (iOS liefert dafür kein Metadatenfeld), sonst
  // ginge stets `sizeBytes: 0` an den Server und jeder Upload schlüge fehl.
  const file = await fetch(fileUri);
  const blob = await file.blob();

  const ticket = await apiFetch<{
    uploadUrl: string;
    path: string;
  }>("/api/mobile/avatar/start", {
    method: "POST",
    body: { mimeType, sizeBytes: blob.size },
  });

  // Direkt-Upload zur signierten URL (Token steckt in der URL; kein
  // weiterer Schlüssel nötig) – gleiches Muster wie der Web-Upload
  // (`src/lib/upload-with-progress.ts`): Supabase Storages
  // Signed-Upload-Endpunkt erwartet `multipart/form-data`. Der Blob aus
  // `fetch(fileUri).blob()` trägt für lokale `file://`-URIs keinen
  // Content-Type (React Natives Fetch-Polyfill setzt keinen), wodurch
  // der Multipart-Teil serverseitig als `text/plain` ankommt und
  // Supabase Storage mit 415/400 ablehnt – behoben, indem der Blob mit
  // explizitem `type` neu verpackt wird. Der ältere RN-Dateideskriptor
  // `{ uri, name, type }` (ohne Blob) scheitert auf dieser RN-Version
  // (0.86, New Architecture) mit "Unsupported FormDataPart
  // implementation" – beides per echtem Server-/Laufzeitfehler
  // bestätigt, nicht vermutet.
  const typedBlob = new Blob([blob], { type: mimeType });
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", typedBlob, `avatar.${extensionForMimeType(mimeType)}`);
  const upload = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body,
  });
  if (!upload.ok) throw new Error(`Upload fehlgeschlagen (${upload.status})`);

  return apiFetch<AvatarUploadResult>("/api/mobile/avatar/finalize", {
    method: "POST",
    body: { path: ticket.path, mimeType },
  });
}

export async function removeAvatar(): Promise<void> {
  await apiFetch("/api/mobile/avatar", { method: "DELETE" });
}

/** E-Mail-Änderung mit Doppelbestätigung (Supabase Auth wie im Web). */
export async function requestEmailChange(newEmail: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
  if (error) throw new Error(error.message);
}

/** Kontolöschung als auditierter Serverantrag (D-062). */
export async function requestAccountDeletion(): Promise<void> {
  await apiFetch("/api/mobile/account-deletion", { method: "POST", body: {} });
}
