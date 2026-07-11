import type { Metadata } from "next";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { getSessionContext } from "@/server/services/session";
import { getPatientTodayData, type TodayExercise } from "@/server/services/patient";
import { AppointmentCard } from "@/components/patient/appointment-card";
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

export default async function TodayPage() {
  // Layout garantiert eine Session; hier nur für die Typen abgesichert.
  const session = (await getSessionContext())!;
  const { exercises, hasPlan, nextAppointment } = await getPatientTodayData(
    session.userId
  );

  const doneCount = exercises.filter((e) => e.completedToday).length;
  const firstName = session.fullName.split(" ")[0] || session.fullName;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">
        {t.greeting}
        {firstName ? `, ${firstName}` : ""}!
      </h1>

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
            <p className="text-lg text-muted-foreground" role="status">
              {t.progress(doneCount, exercises.length)}
            </p>
            <ul className="flex flex-col gap-3">
              {exercises.map((exercise) => (
                <li key={exercise.planItemId}>
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <span
                        className={
                          exercise.completedToday
                            ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
                            : "flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border"
                        }
                        aria-hidden
                      >
                        {exercise.completedToday && (
                          <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-6" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-lg font-bold">{exercise.title}</p>
                        {prescriptionSummary(exercise) && (
                          <p className="text-base text-muted-foreground">
                            {prescriptionSummary(exercise)}
                          </p>
                        )}
                        {exercise.completedToday && (
                          <p className="sr-only">{t.alreadyLogged}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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
