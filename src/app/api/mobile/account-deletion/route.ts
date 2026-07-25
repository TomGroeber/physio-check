import { createSupabaseServiceClient } from "@/server/db/service-client";
import { authenticateMobileRequest, jsonError } from "@/server/services/mobile-auth";

const PATIENT_AVATAR_BUCKET = "patient-avatars";

/**
 * Echte Kontolöschung (Master-Prompt Phase 4, 21.07.2026 – löst D-062
 * ab): Die atomare DB-Funktion `request_account_deletion` löscht
 * sofort alle patientenkontrollierten, nicht aufbewahrungspflichtigen
 * Daten (Telefonnummer, Erinnerungen, Benachrichtigungen, Verweis auf
 * das Profilbild) und schreibt Audit-Ereignis + Antragshistorie. Sie
 * läuft mit den RLS-Rechten des angemeldeten Nutzers (`auth.supabase`),
 * nicht mit Service-Role – nur die eigene Person kann sich selbst
 * löschen.
 *
 * Zwei Schritte brauchen weiterhin Service-Role, weil sie keine
 * Client-Policy haben (bewusst, D-054/D-062): das Storage-Objekt des
 * Profilbilds entfernen und den Login-Zugang sperren.
 *
 * Praxisbezogene Behandlungsdaten (Termine, Übungspläne, Selbst-
 * auskünfte, Verordnungen) bleiben unverändert, bis die Aufbewahrungs-
 * frist für Luxemburg rechtlich bestätigt ist – das ist keine
 * technische Lücke, sondern eine offene Rechtsfrage (s. `retained_data_note`
 * in der Antwort und `docs/PRIVACY_SECURITY.md`).
 */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return jsonError("unauthorized", "Bitte melden Sie sich an.", 401);

  const { data, error } = await auth.supabase.rpc("request_account_deletion", {
    p_profile_id: auth.user.id,
  });
  if (error) {
    return jsonError("failed", "Der Löschantrag konnte nicht verarbeitet werden.", 500);
  }

  const avatarPath = data?.[0]?.avatar_path ?? null;
  const service = createSupabaseServiceClient();

  if (avatarPath) {
    await service.storage.from(PATIENT_AVATAR_BUCKET).remove([avatarPath]);
  }

  // Zugang sperren: Login gesperrt, Auth-Konto und Profil bleiben
  // bestehen (ein Löschen würde auf Praxisverbindungen, Termine,
  // Übungspläne und Verordnungen kaskadieren – genau die Daten mit
  // offener Aufbewahrungsfrist).
  await service.auth.admin.updateUserById(auth.user.id, {
    ban_duration: "876000h",
  });

  return Response.json({
    ok: true,
    retainedDataNote:
      "Praxisbezogene Behandlungsdaten bleiben gespeichert, bis die Aufbewahrungsfrist rechtlich bestätigt ist. Ihr Zugang wurde gesperrt; Profilbild, Telefonnummer und Erinnerungen wurden gelöscht.",
  });
}
