"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionContext } from "@/server/services/session";
import { logExerciseCompletion } from "@/server/services/exercise-log";
import {
  completionLogSchema,
  shouldShowPainHint,
} from "@/lib/validation/exercise-logs";
import { de } from "@/messages/de";

export type LogFormState = { error?: string };

const t = de.patient.exercise;

/** Übungsdurchführung dokumentieren (Selbstauskunft, kein Nachweis). */
export async function logCompletionAction(
  _previousState: LogFormState,
  formData: FormData
): Promise<LogFormState> {
  const parsed = completionLogSchema.safeParse({
    planItemId: formData.get("planItemId"),
    mode: formData.get("mode") ?? "detail",
    status: formData.get("status"),
    setsCompleted: formData.get("setsCompleted"),
    painBefore: formData.get("painBefore"),
    painAfter: formData.get("painAfter"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? de.common.error };
  }

  const session = await getSessionContext();
  if (!session) redirect("/login");
  if (!session.patientLink) redirect("/connect");

  const result = await logExerciseCompletion(parsed.data);
  if (!result.ok) {
    switch (result.reason) {
      case "not_found":
        return { error: t.errorNotFound };
      case "not_due":
        return { error: t.errorNotDueToday };
      case "already_logged":
        return { error: t.errorAlreadyLogged };
      default:
        // Fehler offen melden – kein falscher Erfolgszustand.
        return { error: de.common.error };
    }
  }

  revalidatePath("/today");
  const painHint = shouldShowPainHint({
    painBefore: parsed.data.painBefore,
    painAfter: parsed.data.painAfter,
  });
  const target = parsed.data.mode === "guided" ? "/session" : "/today";
  redirect(painHint ? `${target}?logged=1&painhint=1` : `${target}?logged=1`);
}
