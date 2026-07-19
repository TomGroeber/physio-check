"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/server/services/session";
import {
  createAvatarUploadTicket,
  discardAvatarUpload,
  finalizeAvatarUpload,
  removeOwnAvatar,
  signAvatarPath,
} from "@/server/services/patient-avatar";
import { AVATAR_MIME_TYPES, isAllowedAvatarSize } from "@/config/media";

const prepareSchema = z.object({
  mimeType: z.string().min(1).max(100),
  declaredBytes: z.number().int().positive(),
});

const finalizeSchema = z.object({
  mimeType: z.string().min(1).max(100),
  storagePath: z.string().min(1).max(500),
});

const discardSchema = z.object({ storagePath: z.string().min(1).max(500) });

/**
 * Nur die eigene, aktiv mit einer Praxis verbundene Patientensession
 * darf ihr Profilbild verwalten. Die Identität stammt ausschließlich
 * aus der Server-Session – niemals aus Client-Eingaben.
 */
async function authorizedPatientId(): Promise<string | null> {
  const session = await getSessionContext();
  if (!session || !session.patientLink || session.memberships.length > 0) return null;
  return session.userId;
}

export type AvatarTicketResult =
  | { ok: true; storagePath: string; signedUrl: string }
  | { ok: false; error: string };

export async function prepareAvatarUploadAction(input: {
  mimeType: string;
  declaredBytes: number;
}): Promise<AvatarTicketResult> {
  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ungültige Upload-Angaben." };
  if (!(AVATAR_MIME_TYPES as readonly string[]).includes(parsed.data.mimeType)) {
    return { ok: false, error: "Dieser Dateityp wird nicht unterstützt." };
  }
  if (!isAllowedAvatarSize(parsed.data.declaredBytes)) {
    return { ok: false, error: "Die Datei überschreitet das Größenlimit." };
  }
  const patientId = await authorizedPatientId();
  if (!patientId) return { ok: false, error: "Bitte melden Sie sich erneut an." };

  const ticket = await createAvatarUploadTicket(
    patientId,
    parsed.data.mimeType,
    parsed.data.declaredBytes
  );
  if ("error" in ticket) return { ok: false, error: ticket.error };
  return { ok: true, ...ticket };
}

export type AvatarActionResult =
  | { ok: true; success: string; avatarUrl: string | null }
  | { ok: false; error: string };

export async function finalizeAvatarUploadAction(input: {
  mimeType: string;
  storagePath: string;
}): Promise<AvatarActionResult> {
  const parsed = finalizeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ungültige Upload-Angaben." };
  const patientId = await authorizedPatientId();
  if (!patientId) return { ok: false, error: "Bitte melden Sie sich erneut an." };

  const result = await finalizeAvatarUpload(
    patientId,
    parsed.data.mimeType,
    parsed.data.storagePath
  );
  if (!result.ok) return result;
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  // Frische kurzlebige URL direkt zurückgeben: die Anzeige hängt damit
  // nicht am (unzuverlässig gestreamten) Re-Render, vgl. D-053.
  const avatarUrl = await signAvatarPath(patientId, parsed.data.storagePath);
  return { ok: true, success: "Ihr Profilbild wurde gespeichert.", avatarUrl };
}

export async function removeAvatarAction(): Promise<AvatarActionResult> {
  const patientId = await authorizedPatientId();
  if (!patientId) return { ok: false, error: "Bitte melden Sie sich erneut an." };
  const result = await removeOwnAvatar(patientId);
  if (!result.ok) return result;
  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true, success: "Ihr Profilbild wurde entfernt.", avatarUrl: null };
}

/** Best effort: räumt ein Objekt auf, wenn der Upload abbricht. */
export async function discardAvatarUploadAction(input: {
  storagePath: string;
}): Promise<void> {
  const parsed = discardSchema.safeParse(input);
  if (!parsed.success) return;
  const patientId = await authorizedPatientId();
  if (!patientId) return;
  await discardAvatarUpload(patientId, parsed.data.storagePath);
}
