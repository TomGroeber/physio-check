import { z } from "zod";
import { createAvatarUploadTicket } from "@/server/services/patient-avatar";
import { authenticateMobileRequest, jsonError } from "@/server/services/mobile-auth";

const schema = z.object({
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});

/** Profilbild-Upload-Ticket (D-054/D-059): Pfad und Prüfung serverseitig. */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return jsonError("unauthorized", "Bitte melden Sie sich an.", 401);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Ungültige Anfrage.", 400);

  const ticket = await createAvatarUploadTicket(
    auth.user.id,
    parsed.data.mimeType,
    parsed.data.sizeBytes
  );
  if ("error" in ticket) return jsonError("rejected", ticket.error, 422);
  return Response.json({ uploadUrl: ticket.signedUrl, path: ticket.storagePath });
}
