import type { ExerciseDetail } from "@/server/services/exercise-log";
import { de } from "@/messages/de";

const t = de.patient.exercise;
const u = de.units;

/**
 * Kompakte Dosierungsangaben („3 Sätze“, „12 Wiederholungen“, …) als
 * einzelne, gut lesbare Werte – bewusst ohne Fließtext.
 */
function prescriptionChips(detail: ExerciseDetail): string[] {
  const chips: string[] = [];
  if (detail.sets) chips.push(`${detail.sets} ${detail.sets === 1 ? u.set : u.sets}`);
  if (detail.repetitions) chips.push(`${detail.repetitions} ${u.repetitions}`);
  if (detail.holdSeconds) chips.push(u.holdSeconds(detail.holdSeconds));
  if (detail.totalDurationSeconds)
    chips.push(u.minutes(Math.round(detail.totalDurationSeconds / 60)));
  if (detail.restSeconds) chips.push(u.restSeconds(detail.restSeconds));
  if (detail.equipment) chips.push(`${t.equipment}: ${detail.equipment}`);
  return chips;
}

function scheduleText(detail: ExerciseDetail): string {
  if (detail.schedule.mode === "times_per_week") {
    return t.scheduleFlexible(detail.schedule.times_per_week);
  }
  const days = detail.schedule.weekdays
    .map((weekday) => de.patient.session.weekdaysShort[weekday - 1])
    .join(", ");
  return t.scheduleFixed(days, detail.schedule.times_per_day);
}

/**
 * Video-first-Ansicht einer Übung für Patienten: großes Medium oben,
 * darunter ausschließlich die kompakten Vorgaben zur Durchführung.
 * Beschreibung, Ausgangsposition, Schritte und häufige Fehler bleiben
 * bewusst der Übungsverwaltung der Praxis vorbehalten und werden hier
 * nicht dargestellt (die Daten bleiben unverändert erhalten).
 */
export function ExerciseView({ detail }: { detail: ExerciseDetail }) {
  const chips = prescriptionChips(detail);

  return (
    <div className="flex flex-col gap-5">
      {/* Medium: auf schmalen Bildschirmen randlos über die volle Breite. */}
      <figure className="-mx-4 sm:mx-0" aria-label={t.videoHeading}>
        {detail.videoUrl ? (
          <div className="aspect-video w-full overflow-hidden bg-black sm:rounded-2xl">
            {/* Kein Autoplay; Ton startet nur auf Wunsch des Patienten. */}
            <video
              controls
              preload="metadata"
              playsInline
              poster={detail.posterUrl ?? undefined}
              className="h-full w-full"
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
          </div>
        ) : detail.fallbackImageUrl ? (
          <div className="aspect-video w-full overflow-hidden bg-muted sm:rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- kurzlebige signierte Storage-URL. */}
            <img
              src={detail.fallbackImageUrl}
              alt={t.fallbackImageAlt(detail.title)}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted/60 px-6 text-center sm:rounded-2xl">
            <p className="text-lg font-semibold">{t.noVideo}</p>
            <p className="text-base text-muted-foreground">{t.noVideoBody}</p>
          </div>
        )}
      </figure>

      {/* Vorgaben: eine ruhige Fläche statt verschachtelter Karten. */}
      <section
        aria-label={t.prescriptionHeading}
        className="flex flex-col gap-4 rounded-2xl bg-muted/40 p-5"
      >
        {chips.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip}
                className="flex min-h-12 items-center rounded-full border bg-card px-5 text-lg font-semibold"
              >
                {chip}
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-lg">{scheduleText(detail)}</p>
        {detail.schedule.preferred_times.length > 0 ? (
          <p className="text-lg">
            {t.preferredTimes(
              detail.schedule.preferred_times
                .map((time) => `${time} ${u.timeSuffix}`)
                .join(", ")
            )}
          </p>
        ) : null}
        {detail.planNote ? (
          <div className="rounded-xl bg-primary/10 p-4">
            <p className="text-base font-bold">{t.planNote}</p>
            <p className="text-lg">{detail.planNote}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
