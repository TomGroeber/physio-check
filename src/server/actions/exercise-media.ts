"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSessionContext } from "@/server/services/session";
import { getPracticeExercise } from "@/server/services/exercises";
import {
  auditExerciseMedia,
  createUploadTicket,
  discardUpload,
  finalizeUpload,
  removeMedia,
} from "@/server/services/exercise-media";
import { allowedMimeTypes, maxBytes } from "@/config/media";

const mediaKindSchema = z.enum(["video", "thumbnail", "fallback_image", "captions"]);

const prepareSchema = z.object({
  exerciseId: z.uuid(),
  kind: mediaKindSchema,
  mimeType: z.string().min(1).max(100),
  declaredBytes: z.number().int().positive(),
});

const finalizeSchema = prepareSchema.omit({ declaredBytes: true }).extend({
  storagePath: z.string().min(1).max(500),
});

const removeSchema = z.object({
  exerciseId: z.uuid(),
  mediaId: z.uuid(),
});

const discardSchema = z.object({
  exerciseId: z.uuid(),
  storagePath: z.string().min(1).max(500),
});

async function authorizedExerciseContext(exerciseId: string) {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  const exercise = await getPracticeExercise(membership.practiceId, exerciseId);
  return exercise ? { session, membership } : null;
}

export type PrepareMediaUploadResult =
  | { ok: true; storagePath: string; signedUrl: string }
  | { ok: false; error: string };

/** Erzeugt ein eng begrenztes, kurzlebiges Upload-Ticket für genau eine Übung. */
export async function prepareExerciseMediaUploadAction(input: {
  exerciseId: string;
  kind: string;
  mimeType: string;
  declaredBytes: number;
}): Promise<PrepareMediaUploadResult> {
  const parsed = prepareSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ungültige Upload-Angaben." };
  if (!allowedMimeTypes(parsed.data.kind).includes(parsed.data.mimeType)) {
    return { ok: false, error: "Dieser Dateityp wird nicht unterstützt." };
  }
  if (parsed.data.declaredBytes > maxBytes(parsed.data.kind)) {
    return { ok: false, error: "Die Datei überschreitet das Größenlimit." };
  }
  const context = await authorizedExerciseContext(parsed.data.exerciseId);
  if (!context) return { ok: false, error: "Kein Zugriff auf diese Übung." };

  const ticket = await createUploadTicket(
    context.membership.practiceId,
    parsed.data.exerciseId,
    parsed.data.kind,
    parsed.data.mimeType,
    parsed.data.declaredBytes
  );
  if ("error" in ticket) return { ok: false, error: ticket.error };
  return { ok: true, ...ticket };
}

export type FinalizeMediaUploadResult =
  | { ok: true; success: string }
  | { ok: false; error: string };

/** Prüft die hochgeladene Datei und macht sie erst danach in der App sichtbar. */
export async function finalizeExerciseMediaUploadAction(input: {
  exerciseId: string;
  kind: string;
  mimeType: string;
  storagePath: string;
}): Promise<FinalizeMediaUploadResult> {
  const parsed = finalizeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ungültige Upload-Angaben." };
  const context = await authorizedExerciseContext(parsed.data.exerciseId);
  if (!context) return { ok: false, error: "Kein Zugriff auf diese Übung." };

  const result = await finalizeUpload(
    context.membership.practiceId,
    parsed.data.exerciseId,
    parsed.data.kind,
    parsed.data.mimeType,
    parsed.data.storagePath
  );
  if (!result.ok) return result;
  await auditExerciseMedia(
    context.session.userId,
    context.membership.practiceId,
    result.mediaId,
    "exercise_media_uploaded"
  );
  revalidatePath("/practice/exercises");
  revalidatePath(`/practice/exercises/${parsed.data.exerciseId}`);
  return { ok: true, success: "Das Medium wurde sicher gespeichert." };
}

export async function removeExerciseMediaAction(input: {
  exerciseId: string;
  mediaId: string;
}): Promise<FinalizeMediaUploadResult> {
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ungültiges Medium." };
  const context = await authorizedExerciseContext(parsed.data.exerciseId);
  if (!context) return { ok: false, error: "Kein Zugriff auf diese Übung." };

  const result = await removeMedia(
    context.membership.practiceId,
    parsed.data.exerciseId,
    parsed.data.mediaId
  );
  if (!result.ok) return result;
  await auditExerciseMedia(
    context.session.userId,
    context.membership.practiceId,
    result.mediaId,
    "exercise_media_removed"
  );
  revalidatePath("/practice/exercises");
  revalidatePath(`/practice/exercises/${parsed.data.exerciseId}`);
  return { ok: true, success: "Das Medium wurde entfernt." };
}

/** Best effort: räumt ein Objekt auf, wenn Browser-Upload oder Finalisierung abbricht. */
export async function discardExerciseMediaUploadAction(input: {
  exerciseId: string;
  storagePath: string;
}): Promise<void> {
  const parsed = discardSchema.safeParse(input);
  if (!parsed.success) return;
  const context = await authorizedExerciseContext(parsed.data.exerciseId);
  if (!context) return;
  await discardUpload(
    context.membership.practiceId,
    parsed.data.exerciseId,
    parsed.data.storagePath
  );
}
