import { createSupabaseServiceClient } from "@/server/db/service-client";
import { authenticateMobileRequest, jsonError } from "@/server/services/mobile-auth";

/**
 * Kontolöschung als auditierter Antrag (D-062): Der Antrag wird
 * serverseitig gespeichert, das Audit-Ereignis geschrieben und die
 * Anmeldung des Kontos gesperrt (Bann statt Sofortlöschung – die
 * Aufbewahrungsfrage für Praxisdaten in Luxemburg ist offen, es wird
 * nichts unkontrolliert gelöscht). Kein Service-Key im Client.
 */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return jsonError("unauthorized", "Bitte melden Sie sich an.", 401);

  const service = createSupabaseServiceClient();

  const { error: insertError } = await service
    .from("account_deletion_requests")
    .insert({ profile_id: auth.user.id });
  // Doppelter offener Antrag ist kein Fehler für die Person.
  if (insertError && insertError.code !== "23505") {
    return jsonError("failed", "Der Antrag konnte nicht gespeichert werden.", 500);
  }

  await service.from("audit_events").insert({
    actor_profile_id: auth.user.id,
    event_type: "account_deletion_requested",
    entity_type: "profile",
    entity_id: auth.user.id,
    metadata: {},
  });

  // Zugang deaktivieren: Login gesperrt, Daten bleiben unangetastet,
  // bis der Antrag kontrolliert bearbeitet wird.
  await service.auth.admin.updateUserById(auth.user.id, {
    ban_duration: "876000h",
  });

  return Response.json({ ok: true });
}
