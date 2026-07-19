import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import { getExerciseDetailForPatient } from "@/server/services/exercise-log";
import { ExerciseView } from "@/components/patient/exercise-view";
import { ExerciseLogForm } from "@/components/patient/exercise-log-form";
import { de } from "@/messages/de";

const t = de.patient.exercise;

export const metadata: Metadata = { title: de.patient.today.exercisesHeading };

/**
 * Übungsseite für Patienten: kompakter Titel, großes Video, kompakte
 * Vorgaben, dann die Dokumentation. Beschreibende Langtexte der Übung
 * erscheinen hier bewusst nicht mehr (siehe ExerciseView).
 */
export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ planItemId: string }>;
}) {
  const { planItemId } = await params;
  const session = (await getSessionContext())!;
  const detail = await getExerciseDetailForPatient(session.userId, planItemId);
  if (!detail) notFound();

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/today"
        className="flex min-h-12 items-center gap-2 text-lg font-semibold text-primary"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-5" aria-hidden />
        {t.backToToday}
      </Link>

      <h1 className="text-2xl font-bold">{detail.title}</h1>

      <ExerciseView detail={detail} />

      <section aria-labelledby="log-heading" className="flex flex-col gap-3 border-t pt-5">
        <h2 id="log-heading" className="text-xl font-bold">
          {t.documentHeading}
        </h2>
        {detail.dueToday && (detail.plannedToday > 1 || detail.weeklyProgress) ? (
          <p className="text-lg font-bold" role="status">
            {detail.weeklyProgress
              ? de.patient.today.progressWeek(
                  detail.weeklyProgress.documented,
                  detail.weeklyProgress.target
                )
              : de.patient.today.progressToday(
                  detail.documentedToday,
                  detail.plannedToday
                )}
          </p>
        ) : null}
        {detail.fullyDocumentedToday ? (
          <div className="flex items-start gap-4 rounded-2xl bg-muted/40 p-5">
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-full ${detail.fullyCompletedToday ? "bg-success text-success-foreground" : "border-2 border-warning bg-warning/15"}`}
            >
              <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-bold">{t.alreadyLoggedTitle}</p>
              <p className="text-base text-muted-foreground">{t.alreadyLoggedBody}</p>
              {!detail.fullyCompletedToday ? (
                <p className="mt-2 text-base text-muted-foreground">
                  {t.documentedNotCompleted}
                </p>
              ) : null}
            </div>
          </div>
        ) : detail.canDocument && detail.nextOccurrenceIndex ? (
          <ExerciseLogForm
            planItemId={detail.planItemId}
            maxSets={detail.sets}
            occurrenceIndex={detail.nextOccurrenceIndex}
            plannedOccurrences={detail.plannedToday}
          />
        ) : (
          <div className="rounded-2xl bg-muted/40 p-5 text-lg text-muted-foreground">
            {t.errorNotDueToday}
          </div>
        )}
      </section>
    </div>
  );
}
