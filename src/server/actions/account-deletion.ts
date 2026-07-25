"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/server/db/server-client";
import { createSupabaseServiceClient } from "@/server/db/service-client";
import { getSessionContext } from "@/server/services/session";
import { PATIENT_AVATAR_BUCKET } from "@/config/media";
import { de } from "@/messages/de";

export type DeleteAccountState = { error?: string };

/**
 * Web-Weg zur Kontolöschung (Master-Prompt Phase 4, 21.07.2026): Bisher
 * gab es diesen Weg NUR in der mobilen App, obwohl Phase 4 explizit
 * einen öffentlich per Web auslösbaren Ablauf verlangt. Nutzt dieselbe
 * atomare DB-Funktion `request_account_deletion` wie die mobile Route
 * (`/api/mobile/account-deletion`), damit beide Oberflächen identische
 * Regeln verwenden (keine zweite, abweichende Löschlogik).
 *
 * Kritische Aktion: verlangt eine erneute Passwortbestätigung, bevor
 * irgendetwas gelöscht wird (`signInWithPassword` gegen die eigene,
 * aus der Session gelesene E-Mail-Adresse – kein Feld aus dem Client).
 */
export async function requestAccountDeletionAction(
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (!session.patientLink || session.memberships.length > 0 || !session.email) {
    return { error: de.common.error };
  }

  const password = String(formData.get("password") ?? "");
  if (!password) {
    return { error: de.patient.profile.deleteAccount.error };
  }

  const supabase = await createSupabaseServerClient();
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: session.email,
    password,
  });
  if (reauthError) {
    return { error: de.auth.login.errorInvalidCredentials };
  }

  const { data, error } = await supabase.rpc("request_account_deletion", {
    p_profile_id: session.userId,
  });
  if (error) {
    return { error: de.patient.profile.deleteAccount.error };
  }

  const avatarPath = data?.[0]?.avatar_path ?? null;
  const service = createSupabaseServiceClient();
  if (avatarPath) {
    await service.storage.from(PATIENT_AVATAR_BUCKET).remove([avatarPath]);
  }
  // Zugang sperren: Login gesperrt, Auth-Konto und Profil bleiben
  // bestehen (Kaskade auf Praxisdaten mit offener Aufbewahrungsfrist,
  // siehe Migration 20260721100000_real_account_deletion.sql).
  await service.auth.admin.updateUserById(session.userId, {
    ban_duration: "876000h",
  });

  await supabase.auth.signOut();
  redirect("/login?account_deleted=1");
}
