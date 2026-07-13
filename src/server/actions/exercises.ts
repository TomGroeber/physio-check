"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import {
  auditExercise,
  createExercise,
  duplicateExercise,
  getPracticeExercise,
  setExerciseActive,
  setExerciseArchived,
  updateExercise,
} from "@/server/services/exercises";
import {
  createExerciseSchema,
  exerciseIdSchema,
  updateExerciseSchema,
} from "@/lib/validation/exercises";

export type ExerciseActionState = { error?: string; success?: string };

async function practiceContext() {
  const session = await getSessionContext();
  const membership = session?.memberships[0];
  if (!session || !membership) return null;
  return { session, membership };
}

function fieldsFromForm(formData: FormData) {
  return {
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    startingPosition: formData.get("startingPosition") ?? "",
    stepsText: formData.get("stepsText") ?? "",
    commonMistakes: formData.get("commonMistakes") ?? "",
    equipment: formData.get("equipment") ?? "",
    category: formData.get("category") ?? "",
    defaultDosageType: formData.get("defaultDosageType"),
    defaultSets: formData.get("defaultSets") ?? "",
    defaultRepetitions: formData.get("defaultRepetitions") ?? "",
    defaultHoldSeconds: formData.get("defaultHoldSeconds") ?? "",
    defaultTotalDurationSeconds: formData.get("defaultTotalDurationSeconds") ?? "",
    defaultRestSeconds: formData.get("defaultRestSeconds") ?? "",
  };
}

export async function createExerciseAction(
  _state: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  const parsed = createExerciseSchema.safeParse(fieldsFromForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };

  let exerciseId: string;
  try {
    exerciseId = await createExercise(
      context.membership.practiceId,
      context.membership.memberId,
      parsed.data
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unbekannter Fehler." };
  }
  await auditExercise(
    context.session.userId,
    context.membership.practiceId,
    exerciseId,
    "exercise_created"
  );
  revalidatePath("/practice/exercises");
  redirect(`/practice/exercises/${exerciseId}`);
}

export async function updateExerciseAction(
  _state: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  const parsed = updateExerciseSchema.safeParse({
    ...fieldsFromForm(formData),
    exerciseId: formData.get("exerciseId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };

  try {
    await updateExercise(context.membership.practiceId, parsed.data.exerciseId, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unbekannter Fehler." };
  }
  await auditExercise(
    context.session.userId,
    context.membership.practiceId,
    parsed.data.exerciseId,
    "exercise_updated"
  );
  revalidatePath("/practice/exercises");
  revalidatePath(`/practice/exercises/${parsed.data.exerciseId}`);
  return { success: "Die Übung wurde gespeichert." };
}

export async function duplicateExerciseAction(
  _state: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  const parsed = exerciseIdSchema.safeParse({ exerciseId: formData.get("exerciseId") });
  if (!parsed.success) return { error: "Ungültige Übung." };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };

  let newId: string;
  try {
    newId = await duplicateExercise(
      context.membership.practiceId,
      context.membership.memberId,
      parsed.data.exerciseId
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unbekannter Fehler." };
  }
  await auditExercise(
    context.session.userId,
    context.membership.practiceId,
    newId,
    "exercise_duplicated"
  );
  revalidatePath("/practice/exercises");
  redirect(`/practice/exercises/${newId}`);
}

async function toggleAction(
  formData: FormData,
  apply: (practiceId: string, exerciseId: string) => Promise<void>,
  eventType: string
): Promise<ExerciseActionState> {
  const parsed = exerciseIdSchema.safeParse({ exerciseId: formData.get("exerciseId") });
  if (!parsed.success) return { error: "Ungültige Übung." };
  const context = await practiceContext();
  if (!context) return { error: "Sie sind nicht für eine Praxis angemeldet." };
  const exercise = await getPracticeExercise(context.membership.practiceId, parsed.data.exerciseId);
  if (!exercise) return { error: "Übung nicht gefunden." };
  try {
    await apply(context.membership.practiceId, parsed.data.exerciseId);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unbekannter Fehler." };
  }
  await auditExercise(
    context.session.userId,
    context.membership.practiceId,
    parsed.data.exerciseId,
    eventType
  );
  revalidatePath("/practice/exercises");
  revalidatePath(`/practice/exercises/${parsed.data.exerciseId}`);
  return {};
}

export async function deactivateExerciseAction(
  _state: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  return toggleAction(
    formData,
    (practiceId, exerciseId) => setExerciseActive(practiceId, exerciseId, false),
    "exercise_deactivated"
  );
}

export async function activateExerciseAction(
  _state: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  return toggleAction(
    formData,
    (practiceId, exerciseId) => setExerciseActive(practiceId, exerciseId, true),
    "exercise_activated"
  );
}

export async function archiveExerciseAction(
  _state: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  return toggleAction(
    formData,
    (practiceId, exerciseId) => setExerciseArchived(practiceId, exerciseId, true),
    "exercise_archived"
  );
}

export async function unarchiveExerciseAction(
  _state: ExerciseActionState,
  formData: FormData
): Promise<ExerciseActionState> {
  return toggleAction(
    formData,
    (practiceId, exerciseId) => setExerciseArchived(practiceId, exerciseId, false),
    "exercise_unarchived"
  );
}
