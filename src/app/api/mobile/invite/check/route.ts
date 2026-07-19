import { z } from "zod";
import { inspectInviteCode } from "@/server/services/invites";
import { jsonError } from "@/server/services/mobile-auth";

const schema = z.object({ code: z.string().min(1).max(64) });

/**
 * Code-Vorprüfung für die Patienten-App (D-059): Patienten können
 * patient_invites per RLS nicht lesen; die Prüfung läuft über den
 * bestehenden Web-Prüfweg inklusive persistentem Rate-Limit. Die
 * Rückgabe enthält nur, was die App anzeigen muss – nie den Hash.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("invalid_request", "Ungültige Anfrage.", 400);

  const inspection = await inspectInviteCode(parsed.data.code);
  if (inspection.status === "rate_limited") {
    return jsonError(
      "rate_limited",
      "Zu viele Versuche. Bitte warten Sie einen Moment.",
      429
    );
  }
  if (inspection.status !== "valid") {
    return jsonError("invalid_code", "Dieser Code ist nicht gültig.", 404);
  }
  return Response.json({
    inviteId: inspection.invite.id,
    practiceName: inspection.invite.practiceName,
    expiresAt: inspection.invite.expiresAt,
  });
}
