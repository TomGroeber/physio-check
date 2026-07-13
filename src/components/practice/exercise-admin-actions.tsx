"use client";

import { useActionState } from "react";
import {
  activateExerciseAction,
  archiveExerciseAction,
  deactivateExerciseAction,
  duplicateExerciseAction,
  unarchiveExerciseAction,
  type ExerciseActionState,
} from "@/server/actions/exercises";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

const t = de.practice.exercises;

/** Duplizieren / Deaktivieren / Archivieren einer Übung. */
export function ExerciseAdminActions({
  exerciseId,
  isActive,
  isArchived,
}: {
  exerciseId: string;
  isActive: boolean;
  isArchived: boolean;
}) {
  const [duplicateState, duplicateFormAction, duplicating] = useActionState<ExerciseActionState, FormData>(duplicateExerciseAction, {});
  const [activeState, activeFormAction, toggling] = useActionState<ExerciseActionState, FormData>(
    isActive ? deactivateExerciseAction : activateExerciseAction,
    {}
  );
  const [archiveState, archiveFormAction, archiving] = useActionState<ExerciseActionState, FormData>(
    isArchived ? unarchiveExerciseAction : archiveExerciseAction,
    {}
  );

  return (
    <section className="flex flex-col gap-3 rounded-xl border p-4">
      <FormMessage error={duplicateState.error ?? activeState.error ?? archiveState.error} />
      <div className="flex flex-wrap gap-2">
        <form action={duplicateFormAction}>
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <Button type="submit" variant="outline" disabled={duplicating} className="h-11 text-base">
            {duplicating ? de.common.loading : t.duplicate}
          </Button>
        </form>
        <form action={activeFormAction}>
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <Button type="submit" variant="outline" disabled={toggling} className="h-11 text-base">
            {toggling ? de.common.loading : isActive ? t.deactivate : t.activate}
          </Button>
        </form>
        <form action={archiveFormAction}>
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <Button type="submit" variant="outline" disabled={archiving} className="h-11 text-base">
            {archiving ? de.common.loading : isArchived ? t.unarchive : t.archive}
          </Button>
        </form>
      </div>
      <p className="text-sm text-muted-foreground">{t.inactiveHint}</p>
      <p className="text-sm text-muted-foreground">{t.archiveHint}</p>
    </section>
  );
}
