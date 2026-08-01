import { de } from "@/messages/de";

const t = de.practice.exercises.preview;
const p = de.patient.exercise;
const u = de.units;

export type PatientPreviewExercise = {
  equipment: string | null;
  defaultSets: number | null;
  defaultRepetitions: number | null;
  defaultHoldSeconds: number | null;
  defaultTotalDurationSeconds: number | null;
  defaultRestSeconds: number | null;
};

export type PatientPreviewMedia = {
  videoUrl: string | null;
  posterUrl: string | null;
  fallbackImageUrl: string | null;
};

function dosageChips(exercise: PatientPreviewExercise): string[] {
  const chips: string[] = [];
  if (exercise.defaultSets)
    chips.push(`${exercise.defaultSets} ${exercise.defaultSets === 1 ? u.set : u.sets}`);
  if (exercise.defaultRepetitions) chips.push(`${exercise.defaultRepetitions} ${u.repetitions}`);
  if (exercise.defaultHoldSeconds) chips.push(u.holdSeconds(exercise.defaultHoldSeconds));
  if (exercise.defaultTotalDurationSeconds)
    chips.push(u.minutes(Math.round(exercise.defaultTotalDurationSeconds / 60)));
  if (exercise.defaultRestSeconds) chips.push(u.restSeconds(exercise.defaultRestSeconds));
  if (exercise.equipment) chips.push(`${p.equipment}: ${exercise.equipment}`);
  return chips;
}

/**
 * Kompakte Vorschau, wie die Übung später im Patientenplan aussieht –
 * verwendet dieselbe Chip-/Video-Darstellung wie ExerciseView, aber
 * mit den Standardvorgaben der Bibliotheksübung statt planbezogener
 * Daten (Zeitplan/Hinweis gibt es hier noch nicht).
 */
export function ExercisePatientPreview({
  exercise,
  media,
}: {
  exercise: PatientPreviewExercise;
  media: PatientPreviewMedia;
}) {
  const chips = dosageChips(exercise);

  return (
    <section aria-labelledby="exercise-preview-heading" className="flex flex-col gap-3">
      <div>
        <h2 id="exercise-preview-heading" className="text-xl font-bold">
          {t.heading}
        </h2>
        <p className="text-sm text-muted-foreground">{t.hint}</p>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-5">
        <figure aria-label={p.videoHeading}>
          {media.videoUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
              <video
                controls
                preload="metadata"
                playsInline
                poster={media.posterUrl ?? undefined}
                className="h-full w-full"
              >
                <source src={media.videoUrl} />
                {p.videoUnsupported}
              </video>
            </div>
          ) : media.fallbackImageUrl ? (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element -- kurzlebige signierte Storage-URL. */}
              <img src={media.fallbackImageUrl} alt="" className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded-xl bg-muted/60 px-6 text-center">
              <p className="font-semibold">{p.noVideo}</p>
              <p className="text-sm text-muted-foreground">{p.noVideoBody}</p>
            </div>
          )}
        </figure>
        {chips.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip}
                className="flex min-h-10 items-center rounded-full border bg-card px-4 text-sm font-semibold"
              >
                {chip}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
