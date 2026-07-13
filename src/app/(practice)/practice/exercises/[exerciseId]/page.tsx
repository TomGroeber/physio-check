import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { getPracticeExercise } from "@/server/services/exercises";
import { ExerciseForm } from "@/components/practice/exercise-form";
import { ExerciseAdminActions } from "@/components/practice/exercise-admin-actions";
import { ExerciseMediaManager } from "@/components/practice/exercise-media-manager";
import { getMediaPreviewUrls } from "@/server/services/exercise-media";
import { Badge } from "@/components/ui/badge";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.exercises.editTitle };

const t = de.practice.exercises;

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");
  const { exerciseId } = await params;
  const exercise = await getPracticeExercise(session.memberships[0].practiceId, exerciseId);
  if (!exercise) notFound();
  const media = await getMediaPreviewUrls(exercise.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/practice/exercises" className="font-semibold text-primary">
        ← {de.common.back}
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{t.editTitle}</h1>
        {!exercise.is_active ? <Badge variant="secondary">{t.inactive}</Badge> : null}
        {exercise.archived_at ? <Badge variant="secondary">{t.archived}</Badge> : null}
      </div>

      <ExerciseAdminActions
        exerciseId={exercise.id}
        isActive={exercise.is_active}
        isArchived={Boolean(exercise.archived_at)}
      />

      <ExerciseMediaManager exerciseId={exercise.id} media={media} />

      <ExerciseForm
        initial={{
          exerciseId: exercise.id,
          title: exercise.title,
          description: exercise.description,
          startingPosition: exercise.starting_position,
          stepsText: Array.isArray(exercise.steps)
            ? exercise.steps.filter((s): s is string => typeof s === "string").join("\n")
            : "",
          commonMistakes: exercise.common_mistakes,
          equipment: exercise.equipment,
          category: exercise.category,
          defaultDosageType: exercise.default_dosage_type,
          defaultSets: exercise.default_sets,
          defaultRepetitions: exercise.default_repetitions,
          defaultHoldSeconds: exercise.default_hold_seconds,
          defaultTotalDurationSeconds: exercise.default_total_duration_seconds,
          defaultRestSeconds: exercise.default_rest_seconds,
        }}
      />
    </div>
  );
}
