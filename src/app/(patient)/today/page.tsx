import type { Metadata } from "next";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import { getPatientTodayData, type TodayExercise } from "@/server/services/patient";
import { getPatientAuthorizationSummary } from "@/server/services/authorizations";
import { getPatientReminderData } from "@/server/services/reminders";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { PlanNotificationCard } from "@/components/patient/plan-notification-card";
import { SuccessCelebration } from "@/components/patient/success-celebration";
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

/**
 * Genau EIN kompakter Fortschritt pro Übungskarte: bei Wochenzielen der
 * Wochenstand, bei mehreren Tagesdurchgängen der Tagesstand, sonst nichts
 * (den Zustand zeigt der Kreis/Haken).
 */
function progressLine(exercise: TodayExercise): string | null {
  if (exercise.weeklyProgress) {
    return t.progressWeek(
      exercise.weeklyProgress.documented,
      exercise.weeklyProgress.target
    );
  }
  if (exercise.plannedToday > 1) {
    return t.progressToday(exercise.documentedToday, exercise.plannedToday);
  }
  return null;
}

/** Checklisten-Kreis: Haken für erledigt, sonst Stand oder leerer Kreis. */
function ExerciseMark({ exercise }: { exercise: TodayExercise }) {
  if (exercise.fullyDocumentedToday) {
    return (
      <span
        aria-hidden
        className={
          exercise.fullyCompletedToday
            ? "flex size-12 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
            : "flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-warning bg-warning/15"
        }
      >
        <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-7" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-border text-base font-bold"
    >
      {exercise.plannedToday > 1
        ? `${exercise.documentedToday}/${exercise.plannedToday}`
        : ""}
    </span>
  );
}

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ logged?: string; painhint?: string }>;
}) {
  // Layout garantiert eine Session; hier nur für die Typen abgesichert.
  const session = (await getSessionContext())!;
  const [
    { exercises, hasPlan, nextAppointment, timezone },
    authorization,
    { logged, painhint },
  ] =
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
  const remainingOccurrences = Math.max(0, plannedCount - documentedCount);
  const allDone = plannedCount > 0 && remainingOccurrences === 0;
  const allCompleted = plannedCount > 0 && completedCount >= plannedCount;
  const percent = plannedCount > 0 ? Math.round((documentedCount / plannedCount) * 100) : 0;
  const reminders = await getPatientReminderData({
    userId: session.userId,
    timezone,
    remainingOccurrences,
  });
  const firstName = session.fullName.split(" ")[0] || session.fullName;
  // Offene Übungen zuerst; erledigte bleiben sichtbar, aber ruhiger.
  const orderedExercises = [...exercises].sort(
    (a, b) =>
      Number(a.fullyDocumentedToday) - Number(b.fullyDocumentedToday) ||
      a.sortOrder - b.sortOrder
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        {t.greeting}
        {firstName ? `, ${firstName}` : ""}!
      </h1>

      <SuccessCelebration
        loggedStatus={logged}
        allDocumented={allDone}
        allCompleted={allCompleted}
      />
      {painhint ? (
        <Alert className="border-warning bg-warning/15">
          <AlertDescription className="text-base text-foreground">
            {t.painHint}
          </AlertDescription>
        </Alert>
      ) : null}

      {hasPlan && plannedCount > 0 ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5">
            {allDone ? (
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
                >
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-7" />
                </span>
                <div>
                  <p className="text-xl font-bold">{allCompleted ? t.allDoneTitle : t.allReportedTitle}</p>
                  <p className="text-base text-muted-foreground">{allCompleted ? t.allDoneBody : t.allReportedBody}</p>
                </div>
              </div>
            ) : (
              <p className="text-xl font-bold" role="status">
                {t.progressShort(documentedCount, plannedCount)}
              </p>
            )}
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={plannedCount}
              aria-valuenow={documentedCount}
              aria-label={t.progressBarLabel(documentedCount, plannedCount)}
              className="h-3 w-full overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            {!allDone && reminders.showExerciseReminder ? (
              <p className="text-base text-muted-foreground">
                {de.patient.reminders.dueBody(remainingOccurrences)}
              </p>
            ) : null}
            <Link
              href="/session"
              className={
                allDone
                  ? "flex min-h-14 items-center justify-center rounded-lg border-2 border-primary px-5 text-lg font-bold text-primary hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-2"
                  : "flex min-h-14 items-center justify-center rounded-lg bg-primary px-5 text-lg font-bold text-primary-foreground hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2"
              }
            >
              {allDone
                ? de.patient.session.viewSummary
                : documentedCount > 0
                  ? de.patient.session.resume
                  : de.patient.session.start}
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {reminders.planUpdates.length > 0 ? (
        <section aria-labelledby="plan-updates-heading" className="flex flex-col gap-3">
          <h2 id="plan-updates-heading" className="text-xl font-bold">
            {de.patient.reminders.planUpdatesHeading}
          </h2>
          {reminders.planUpdates.map((notification) => (
            <PlanNotificationCard key={notification.id} notification={notification} />
          ))}
        </section>
      ) : null}

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
          <ul className="flex flex-col gap-3">
            {orderedExercises.map((exercise) => (
              <li key={exercise.planItemId}>
                <Link
                  href={`/exercises/${exercise.planItemId}`}
                  aria-label={t.openExercise(exercise.title)}
                  className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Card
                    className={
                      exercise.fullyDocumentedToday
                        ? "bg-muted/40 transition-colors hover:bg-muted/60"
                        : "transition-colors hover:bg-muted/50"
                    }
                  >
                    <CardContent className="flex items-center gap-4 p-5">
                      <ExerciseMark exercise={exercise} />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-bold">{exercise.title}</p>
                        {prescriptionSummary(exercise) && (
                          <p className="text-base text-muted-foreground">
                            {prescriptionSummary(exercise)}
                          </p>
                        )}
                        {exercise.fullyDocumentedToday ? (
                          <p
                            className={
                              exercise.fullyCompletedToday
                                ? "text-base font-semibold text-success"
                                : "text-base font-semibold"
                            }
                          >
                            {exercise.fullyCompletedToday
                              ? t.doneBadge
                              : t.documentedBadge}
                          </p>
                        ) : progressLine(exercise) ? (
                          <p className="text-base font-semibold">
                            {progressLine(exercise)}
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

      <section aria-labelledby="authorization-heading" className="flex flex-col gap-3">
        <h2 id="authorization-heading" className="text-xl font-bold">
          {de.patient.authorization.title}
        </h2>
        <Card>
          <CardContent className="flex flex-col gap-2 p-5">
            {authorization ? (
              <>
                <p className="text-xl font-bold">
                  {de.patient.authorization.remaining(authorization.remaining, authorization.adjustedTotal)}
                </p>
                <p className="text-base font-semibold">{authorization.title}</p>
                <details className="mt-2 rounded-lg border">
                  <summary className="flex min-h-12 cursor-pointer items-center px-3 text-base font-bold text-primary">Hinweis zur Kostenübernahme</summary>
                  <p className="border-t p-3 text-base text-muted-foreground">{de.patient.authorization.coverageHint}</p>
                </details>
              </>
            ) : (
              <p className="text-base text-muted-foreground">{de.patient.authorization.empty}</p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
