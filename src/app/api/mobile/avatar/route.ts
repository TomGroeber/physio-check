import { removeOwnAvatar } from "@/server/services/patient-avatar";
import { authenticateMobileRequest, jsonError } from "@/server/services/mobile-auth";

/** Profilbild entfernen (löscht Objekt + Verweis, auditiert; D-054). */
export async function DELETE(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return jsonError("unauthorized", "Bitte melden Sie sich an.", 401);

  const result = await removeOwnAvatar(auth.user.id);
  if (!result.ok) return jsonError("rejected", result.error, 422);
  return Response.json({ ok: true });
}
