import { z } from "zod";
import {
  finalizeAvatarUpload,
  getOwnAvatarUrl,
} from "@/server/services/patient-avatar";
import { authenticateMobileRequest, jsonError } from "@/server/services/mobile-auth";

const schema = z.object({
  path: z.string().min(1),
  mimeType: z.string().min(1),
});

/**
 * Finalisierung des Profilbild-Uploads: serverseitige Größen- und
 * Magic-Byte-Prüfung, Ersetzen löscht das alte Objekt, Audit ohne
 * Dateinamen (bestehender Service, D-054).
 */
export async function POST(request: Request) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return jsonError("unauthorized", "Bitte melden Sie sich an.", 401);

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("invalid_request", "Ungültige Anfrage.", 400);

  const result = await finalizeAvatarUpload(
    auth.user.id,
    parsed.data.mimeType,
    parsed.data.path
  );
  if (!result.ok) return jsonError("rejected", result.error, 422);

  const signedUrl = await getOwnAvatarUrl(auth.user.id);
  return Response.json({ signedUrl });
}
