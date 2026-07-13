import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import { getPatientTodayData, type TodayExercise } from "@/server/services/patient";
import { getPatientAuthorizationSummary } from "@/server/services/authorizations";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.today.title };

const t = de.patient.today;

/** Kurzzusammenfassung der Vorgaben, z. B. "3 Sätze · 12 Wiederholungen". */
function prescriptionSummary(exercise: TodayExercise): string {
  const u = de.units;
  const parts: string[] = [];
  if (exercise.sets)
    parts.push(`${exercise.sets} ${exercise.sets === 1 ? u.set : u.sets}`);
  if (exercise.repetitions) parts.push(`${exercise.repetitions} ${u.repetitions}`);
  if (exercise.holdSeconds) parts.push(u.holdSeconds(exercise.holdSeconds));
  if (exercise.totalDurationSeconds)
    parts.push(u.minutes(Math.round(exercise.totalDurationSeconds / 60)));
  return parts.join(" · ");
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string; painhint?: string }>;
}) {
  // Layout garantiert eine Session; hier nur für die Typen abgesichert.
  const session = (await getSessionContext())!;
  const [{ exercises, hasPlan, nextAppointment }, authorization, { logged, painhint }] =
    await Promise.all([
      getPatientTodayData(session.userId),
      getPatientAuthorizationSummary(session.userId),
      searchParams,
    ]);

  const plannedCount = exercises.reduce((sum, exercise) => sum + exercise.plannedToday, 0);
  const documentedCount = exercises.reduce(
    (sum, exercise) => sum + exercise.documentedToday,
    0
  );
  const completedCount = exercises.reduce(
    (sum, exercise) => sum + exercise.completedToday,
    0
  );
  const firstName = session.fullName.split(" ")[0] || session.fullName;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        {t.greeting}
        {firstName ? `, ${firstName}` : ""}!
      </h1>

      {logged ? (
        <Alert className="border-success bg-success/10">
          <AlertDescription className="text-base text-foreground" role="status">
            {t.loggedSuccess}
          </AlertDescription>
        </Alert>
      ) : null}
      {painhint ? (
        <Alert className="border-warning bg-warning/15">
          <AlertDescription className="text-base text-foreground">
            {t.painHint}
          </AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="authorization-heading" className="flex flex-col gap-3">
        <h2 id="authorization-heading" className="text-xl font-bold">
          {de.patient.authorization.title}
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            {authorization ? (
              <>
                <p className="text-2xl font-bold">
                  {de.patient.authorization.remaining(authorization.remaining, authorization.adjustedTotal)}
                </p>
                <p className="text-base font-semibold">{authorization.title}</p>
                <p className="text-sm text-muted-foreground">{de.patient.authorization.coverageHint}</p>
              </>
            ) : (
              <p className="text-base text-muted-foreground">{de.patient.authorization.empty}</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="exercises-heading" className="flex flex-col gap-3">
        <h2 id="exercises-heading" className="text-xl font-bold">
          {t.exercisesHeading}
        </h2>
        {!hasPlan ? (
          <Card>
            <CardContent className="p-5 text-lg text-muted-foreground">
              {t.noPlanYet}
            </CardContent>
          </Card>
        ) : exercises.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-lg text-muted-foreground">
              {t.noExercisesToday}
            </CardContent>
          </Card>
        ) : (
          <>
            <Link
              href="/session"
              className="flex min-h-14 items-center justify-center rounded-lg bg-primary px-5 text-lg font-bold text-primary-foreground hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {documentedCount < plannedCount
                ? documentedCount > 0
                  ? de.patient.session.resume
                  : de.patient.session.start
                : de.patient.session.viewSummary}
            </Link>
            <p className="text-lg text-muted-foreground" role="status">
              {t.progress(documentedCount, plannedCount)}
            </p>
            <p className="text-base text-muted-foreground">
              {t.completionProgress(completedCount, plannedCount)}
            </p>
            <ul className="flex flex-col gap-3">
              {exercises.map((exercise) => (
                <li key={exercise.planItemId}>
                  <Link
                    href={`/exercises/${exercise.planItemId}`}
                    aria-label={t.openExercise(exercise.title)}
                    className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <Card className="transition-colors hover:bg-muted/50">
                      <CardContent className="flex items-center gap-4 p-5">
                        <span
                          className={
                            exercise.fullyCompletedToday
                              ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
                              : exercise.fullyDocumentedToday
                                ? "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-warning bg-warning/15 text-sm font-bold"
                                : "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border text-sm font-bold"
                          }
                          aria-label={t.occurrenceProgress(
                            exercise.documentedToday,
                            exercise.plannedToday
                          )}
                        >
                          {exercise.fullyCompletedToday ? (
                            <HugeiconsIcon
                              icon={Tick02Icon}
                              strokeWidth={2.5}
                              className="size-6"
                            />
                          ) : (
                            `${exercise.documentedToday}/${exercise.plannedToday}`
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-bold">{exercise.title}</p>
                          {prescriptionSummary(exercise) && (
                            <p className="text-base text-muted-foreground">
                              {prescriptionSummary(exercise)}
                            </p>
                          )}
                          <p className="text-base font-semibold">
                            {t.occurrenceProgress(
                              exercise.documentedToday,
                              exercise.plannedToday
                            )}
                          </p>
                          {exercise.weeklyProgress ? (
                            <p className="text-base text-muted-foreground">
                              {t.weeklyProgress(
                                exercise.weeklyProgress.documented,
                                exercise.weeklyProgress.target
                              )}
                            </p>
                          ) : null}
                          {exercise.fullyDocumentedToday && !exercise.fullyCompletedToday ? (
                            <p className="text-base text-muted-foreground">
                              {t.documentedNotCompleted}
                            </p>
                          ) : null}
                          {exercise.canDocument && exercise.documentedToday > 0 ? (
                            <p className="text-base font-semibold text-primary">
                              {t.continueOccurrences}
                            </p>
                          ) : null}
                        </div>
                        <HugeiconsIcon
                          icon={ArrowRight02Icon}
                          strokeWidth={2}
                          className="size-6 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-labelledby="appointment-heading" className="flex flex-col gap-3">
        <h2 id="appointment-heading" className="text-xl font-bold">
          {t.nextAppointment}
        </h2>
        {nextAppointment ? (
          <AppointmentCard appointment={nextAppointment} />
        ) : (
          <Card>
            <CardContent className="p-5 text-lg text-muted-foreground">
              {t.noAppointment}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
