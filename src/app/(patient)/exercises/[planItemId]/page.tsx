import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import {
  getExerciseDetailForPatient,
  type ExerciseDetail,
} from "@/server/services/exercise-log";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";
import { LogForm } from "./log-form";

const t = de.patient.exercise;
const u = de.units;

export const metadata: Metadata = { title: de.patient.today.exercisesHeading };

/** Vorgaben als gut lesbare Liste, z. B. "3 Sätze · 12 Wiederholungen". */
function prescriptionParts(detail: ExerciseDetail): string[] {
  const parts: string[] = [];
  if (detail.sets)
    parts.push(`${detail.sets} ${detail.sets === 1 ? u.set : u.sets}`);
  if (detail.repetitions) parts.push(`${detail.repetitions} ${u.repetitions}`);
  if (detail.holdSeconds) parts.push(u.holdSeconds(detail.holdSeconds));
  if (detail.totalDurationSeconds)
    parts.push(u.minutes(Math.round(detail.totalDurationSeconds / 60)));
  if (detail.restSeconds) parts.push(u.restSeconds(detail.restSeconds));
  return parts;
}

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
    <div className="flex flex-col gap-6">
      <Link
        href="/today"
        className="flex min-h-12 items-center gap-2 text-lg font-semibold text-primary"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-5" aria-hidden />
        {t.backToToday}
      </Link>

      <h1 className="text-2xl font-bold">{detail.title}</h1>
      {detail.description ? (
        <p className="text-lg text-muted-foreground">{detail.description}</p>
      ) : null}

      <section aria-label={t.videoHeading}>
        {detail.videoUrl ? (
          // Kein Autoplay; Ton startet nur auf Wunsch des Patienten.
          <video
            controls
            preload="metadata"
            playsInline
            poster={detail.posterUrl ?? undefined}
            className="w-full rounded-xl border bg-black"
          >
            <source src={detail.videoUrl} />
            {detail.captionsUrl ? (
              <track
                kind="captions"
                src={detail.captionsUrl}
                srcLang="de"
                label={t.germanCaptions}
                default
              />
            ) : null}
            {t.videoUnsupported}
          </video>
        ) : detail.fallbackImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- kurzlebige signierte Storage-URL.
          <img
            src={detail.fallbackImageUrl}
            alt={t.fallbackImageAlt(detail.title)}
            className="w-full rounded-xl border object-contain"
          />
        ) : (
          <Card>
            <CardContent className="p-5 text-lg text-muted-foreground">
              {t.noVideo}
            </CardContent>
          </Card>
        )}
      </section>

      <section aria-labelledby="prescription-heading" className="flex flex-col gap-2">
        <h2 id="prescription-heading" className="text-xl font-bold">
          {t.prescriptionHeading}
        </h2>
        {prescriptionParts(detail).length > 0 ? (
          <p className="text-lg">{prescriptionParts(detail).join(" · ")}</p>
        ) : null}
        {detail.planNote ? (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-base font-semibold">{t.planNote}</p>
            <p className="text-lg">{detail.planNote}</p>
          </div>
        ) : null}
      </section>

      {detail.startingPosition ? (
        <section aria-labelledby="position-heading" className="flex flex-col gap-2">
          <h2 id="position-heading" className="text-xl font-bold">
            {t.startingPosition}
          </h2>
          <p className="text-lg">{detail.startingPosition}</p>
        </section>
      ) : null}

      {detail.steps.length > 0 ? (
        <section aria-labelledby="steps-heading" className="flex flex-col gap-2">
          <h2 id="steps-heading" className="text-xl font-bold">
            {t.steps}
          </h2>
          <ol className="flex list-decimal flex-col gap-2 pl-6 text-lg">
            {detail.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>
      ) : null}

      {detail.commonMistakes ? (
        <section aria-labelledby="mistakes-heading" className="flex flex-col gap-2">
          <h2 id="mistakes-heading" className="text-xl font-bold">
            {t.commonMistakes}
          </h2>
          <p className="text-lg">{detail.commonMistakes}</p>
        </section>
      ) : null}

      {detail.equipment ? (
        <section aria-labelledby="equipment-heading" className="flex flex-col gap-2">
          <h2 id="equipment-heading" className="text-xl font-bold">
            {t.equipment}
          </h2>
          <p className="text-lg">{detail.equipment}</p>
        </section>
      ) : null}

      <section aria-labelledby="log-heading" className="flex flex-col gap-3">
        <h2 id="log-heading" className="text-xl font-bold">
          {t.documentHeading}
        </h2>
        {detail.dueToday ? (
          <Card>
            <CardContent className="flex flex-col gap-1 p-5" role="status">
              <p className="text-lg font-bold">
                {t.occurrenceProgress(detail.documentedToday, detail.plannedToday)}
              </p>
              <p className="text-base text-muted-foreground">
                {t.completedProgress(detail.completedToday, detail.plannedToday)}
              </p>
              {detail.weeklyProgress ? (
                <p className="text-base text-muted-foreground">
                  {t.weeklyProgress(
                    detail.weeklyProgress.documented,
                    detail.weeklyProgress.target
                  )}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
        {detail.fullyDocumentedToday ? (
          <Card>
            <CardContent className="flex items-start gap-4 p-5">
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${detail.fullyCompletedToday ? "bg-success text-success-foreground" : "border-2 border-warning bg-warning/15"}`}>
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-6" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-bold">{t.alreadyLoggedTitle}</p>
                <p className="text-base text-muted-foreground">
                  {t.alreadyLoggedBody}
                </p>
                {!detail.fullyCompletedToday ? (
                  <p className="mt-2 text-base text-muted-foreground">
                    {t.documentedNotCompleted}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : detail.canDocument && detail.nextOccurrenceIndex ? (
          <LogForm
            planItemId={detail.planItemId}
            maxSets={detail.sets}
            occurrenceIndex={detail.nextOccurrenceIndex}
            plannedOccurrences={detail.plannedToday}
          />
        ) : (
          <Card>
            <CardContent className="p-5 text-lg text-muted-foreground">
              {t.errorNotDueToday}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
