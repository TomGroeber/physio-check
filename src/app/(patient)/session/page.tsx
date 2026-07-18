import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import { getPatientTodayData } from "@/server/services/patient";
import { getExerciseDetailForPatient, type ExerciseDetail } from "@/server/services/exercise-log";
import { exerciseTimerDuration } from "@/lib/exercise-timer";
import { ExerciseTimer } from "@/components/patient/exercise-timer";
import { ExerciseLogForm } from "@/components/patient/exercise-log-form";
import { SuccessCelebration } from "@/components/patient/success-celebration";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.session.title };

const t = de.patient.session;
const exerciseText = de.patient.exercise;

function prescriptionParts(detail: ExerciseDetail): string[] {
  const parts: string[] = [];
  if (detail.sets) parts.push(`${detail.sets} ${detail.sets === 1 ? de.units.set : de.units.sets}`);
  if (detail.repetitions) parts.push(`${detail.repetitions} ${de.units.repetitions}`);
  if (detail.holdSeconds) parts.push(de.units.holdSeconds(detail.holdSeconds));
  if (detail.totalDurationSeconds) {
    parts.push(de.units.minutes(Math.round(detail.totalDurationSeconds / 60)));
  }
  if (detail.restSeconds) parts.push(de.units.restSeconds(detail.restSeconds));
  return parts;
}

function scheduleText(detail: ExerciseDetail): string {
  if (detail.schedule.mode === "times_per_week") {
    return exerciseText.scheduleFlexible(detail.schedule.times_per_week);
  }
  const days = detail.schedule.weekdays
    .map((weekday) => t.weekdaysShort[weekday - 1])
    .join(", ");
  return exerciseText.scheduleFixed(days, detail.schedule.times_per_day);
}

export default async function GuidedSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string; painhint?: string }>;
}) {
  const session = (await getSessionContext())!;
  const [today, query] = await Promise.all([
    getPatientTodayData(session.userId),
    searchParams,
  ]);
  const planned = today.exercises.reduce((sum, exercise) => sum + exercise.plannedToday, 0);
  const documented = today.exercises.reduce(
    (sum, exercise) => sum + exercise.documentedToday,
    0
  );
  const completed = today.exercises.reduce(
    (sum, exercise) => sum + exercise.completedToday,
    0
  );
  const allDocumented = planned > 0 && documented >= planned;
  const allCompleted = planned > 0 && completed >= planned;
  const current = today.exercises.find((exercise) => exercise.canDocument) ?? null;
  const detail = current
    ? await getExerciseDetailForPatient(session.userId, current.planItemId)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/today" className="flex min-h-12 items-center gap-2 text-lg font-semibold text-primary">
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-5" aria-hidden />
        {t.backToToday}
      </Link>
      <div>
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <p className="mt-2 text-lg" role="status">
          {de.patient.today.progressShort(documented, planned)}
        </p>
      </div>

      <SuccessCelebration
        loggedStatus={query.logged}
        allDocumented={allDocumented}
        allCompleted={allCompleted}
      />
      {query.painhint ? (
        <Alert className="border-warning bg-warning/15">
          <AlertDescription className="text-base text-foreground">
            {de.patient.today.painHint}
          </AlertDescription>
        </Alert>
      ) : null}

      {current && detail?.canDocument && detail.nextOccurrenceIndex ? (
        <>
          <section aria-labelledby="guided-exercise-heading" className="flex flex-col gap-5">
            <div>
              <p className="text-base font-bold text-primary">{t.nextHeading}</p>
              <h2 id="guided-exercise-heading" className="mt-1 text-3xl font-bold">{detail.title}</h2>
              {detail.description ? <p className="mt-2 text-lg text-muted-foreground">{detail.description}</p> : null}
            </div>

            <section aria-label={exerciseText.videoHeading}>
              {detail.videoUrl ? (
                <video controls preload="metadata" playsInline poster={detail.posterUrl ?? undefined} className="w-full rounded-xl border bg-black">
                  <source src={detail.videoUrl} />
                  {detail.captionsUrl ? <track kind="captions" src={detail.captionsUrl} srcLang="de" label={exerciseText.germanCaptions} default /> : null}
                  {exerciseText.videoUnsupported}
                </video>
              ) : detail.fallbackImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- kurzlebige signierte Storage-URL.
                <img src={detail.fallbackImageUrl} alt={exerciseText.fallbackImageAlt(detail.title)} className="w-full rounded-xl border object-contain" />
              ) : (
                <Card><CardContent className="p-5 text-lg text-muted-foreground">{exerciseText.noVideo}</CardContent></Card>
              )}
            </section>

            <Card>
              <CardContent className="flex flex-col gap-3 p-5">
                <h3 className="text-xl font-bold">{exerciseText.prescriptionHeading}</h3>
                {prescriptionParts(detail).length > 0 ? <p className="text-xl font-semibold">{prescriptionParts(detail).join(" · ")}</p> : null}
                <p className="text-lg">{scheduleText(detail)}</p>
                {detail.schedule.preferred_times.length > 0 ? (
                  <p className="text-base text-muted-foreground">
                    {exerciseText.preferredTimes(
                      detail.schedule.preferred_times
                        .map((time) => `${time} ${de.units.timeSuffix}`)
                        .join(", ")
                    )}
                  </p>
                ) : null}
                {detail.planNote ? <p className="rounded-lg bg-muted p-4 text-lg">{detail.planNote}</p> : null}
              </CardContent>
            </Card>

            {detail.startingPosition ? (
              <section className="flex flex-col gap-2" aria-labelledby="guided-position-heading">
                <h3 id="guided-position-heading" className="text-xl font-bold">{exerciseText.startingPosition}</h3>
                <p className="text-lg">{detail.startingPosition}</p>
              </section>
            ) : null}
            {detail.steps.length > 0 ? (
              <section className="flex flex-col gap-2" aria-labelledby="guided-steps-heading">
                <h3 id="guided-steps-heading" className="text-xl font-bold">{exerciseText.steps}</h3>
                <ol className="flex list-decimal flex-col gap-3 pl-7 text-lg">
                  {detail.steps.map((step, index) => <li key={index}>{step}</li>)}
                </ol>
              </section>
            ) : null}
            {detail.commonMistakes ? (
              <section className="flex flex-col gap-2" aria-labelledby="guided-mistakes-heading">
                <h3 id="guided-mistakes-heading" className="text-xl font-bold">{exerciseText.commonMistakes}</h3>
                <p className="text-lg">{detail.commonMistakes}</p>
              </section>
            ) : null}
            {detail.equipment ? (
              <section className="flex flex-col gap-2" aria-labelledby="guided-equipment-heading">
                <h3 id="guided-equipment-heading" className="text-xl font-bold">{exerciseText.equipment}</h3>
                <p className="text-lg">{detail.equipment}</p>
              </section>
            ) : null}
          </section>

          {exerciseTimerDuration(detail) ? (
            <ExerciseTimer durationSeconds={exerciseTimerDuration(detail)!} />
          ) : null}

          <section aria-labelledby="guided-log-heading" className="flex flex-col gap-3">
            <h2 id="guided-log-heading" className="text-2xl font-bold">{exerciseText.documentHeading}</h2>
            <p className="text-base text-muted-foreground">{t.autoContinueHint}</p>
            <ExerciseLogForm
              planItemId={detail.planItemId}
              maxSets={detail.sets}
              occurrenceIndex={detail.nextOccurrenceIndex}
              plannedOccurrences={detail.plannedToday}
              mode="guided"
            />
          </section>
        </>
      ) : (
        <section aria-labelledby="session-summary-heading">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground">
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-8" aria-hidden />
              </span>
              <h2 id="session-summary-heading" className="text-2xl font-bold">{t.summaryTitle}</h2>
              <p className="text-lg">{planned > 0 ? t.summaryDone : t.noSessionToday}</p>
              <p className="text-lg font-semibold">{t.progress(documented, planned)}</p>
              <p className="text-base text-muted-foreground">{t.completedProgress(completed, planned)}</p>
              {documented > completed ? (
                <p className="text-base text-muted-foreground">{t.summaryFeedback(documented - completed)}</p>
              ) : null}
              <Link href="/today" className="flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-lg font-bold text-primary-foreground">
                {de.patient.today.title}
              </Link>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
