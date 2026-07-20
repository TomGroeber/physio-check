import { DEFAULT_REMINDER_PREFERENCES } from "@physio-check/shared";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase";

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
  mimeType: string,
  sizeBytes: number
): Promise<AvatarUploadResult> {
  const ticket = await apiFetch<{
    uploadUrl: string;
    path: string;
  }>("/api/mobile/avatar/start", {
    method: "POST",
    body: { mimeType, sizeBytes },
  });

  // Direkt-Upload zur signierten URL (Token steckt in der URL; kein
  // weiterer Schlüssel nötig) – gleiches Muster wie der Web-Upload.
  const file = await fetch(fileUri);
  const blob = await file.blob();
  const upload = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": mimeType, "x-upsert": "false" },
    body: blob,
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
