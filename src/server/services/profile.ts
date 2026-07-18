import "server-only";

import { createSupabaseServerClient } from "@/server/db/server-client";
import type { CalendarColor } from "@/lib/calendar-colors";

/** Eigenes Profil (Name, Telefonnummer) für die Profilseite. */
export async function getOwnProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/**
 * Auth-Kontostand für die Profilseite: aktuelle Adresse und eine eventuell
 * angeforderte, noch unbestätigte neue Adresse (Supabase `new_email`).
 * Solange die doppelte Bestätigung aussteht, bleibt `email` unverändert.
 */
export async function getOwnAccountEmails() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return {
    email: user?.email ?? null,
    pendingEmail: user?.new_email ?? null,
  };
}

/** Eigene Telefonnummer ändern (RLS: „profiles: update own“). */
export async function updateOwnPhone(userId: string, phone: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("profiles").update({ phone }).eq("id", userId);
  if (error) throw new Error(`Telefonnummer konnte nicht gespeichert werden: ${error.message}`);
}

/**
 * Telefonnummer eines aktiv verbundenen Patienten korrigieren.
 * Autorisierung passiert zusätzlich in der DB-Funktion selbst
 * (aktive Mitgliedschaft + aktive Verbindung).
 */
export async function setPatientPhone(patientId: string, phone: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_patient_phone", {
    target_patient_id: patientId,
    new_phone: phone,
  });
  if (error) throw new Error(`Telefonnummer konnte nicht gespeichert werden: ${error.message}`);
}

/** Aktuelle Kalenderfarbe der eigenen Mitgliedschaft. */
export async function getOwnCalendarColor(memberId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("practice_members")
    .select("calendar_color")
    .eq("id", memberId)
    .maybeSingle();
  return data?.calendar_color ?? "teal";
}

/**
 * Eigene Kalenderfarbe setzen. Spaltenrecht + RLS begrenzen die
 * Änderung auf calendar_color der eigenen Mitgliedschaft.
 */
export async function setOwnCalendarColor(memberId: string, userId: string, color: CalendarColor) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("practice_members")
    .update({ calendar_color: color })
    .eq("id", memberId)
    .eq("profile_id", userId);
  if (error) throw new Error(`Kalenderfarbe konnte nicht gespeichert werden: ${error.message}`);
}
