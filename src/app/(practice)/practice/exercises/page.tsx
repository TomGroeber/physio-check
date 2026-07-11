import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { listExercises } from "@/server/services/practice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.exercises.title };

const t = de.practice.exercises;

/**
 * Übungsbibliothek der Praxis. Anlegen/Bearbeiten inkl. Video-Upload
 * folgt in Phase 2.
 */
export default async function ExercisesPage() {
  const session = (await getSessionContext())!;
  const exercises = await listExercises(session.memberships[0].practiceId);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-base text-muted-foreground">
            {t.empty}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <Card>
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {exercise.title}
                    </p>
                    {exercise.description && (
                      <p className="truncate text-sm text-muted-foreground">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                  {!exercise.is_active && (
                    <Badge variant="secondary">{t.inactive}</Badge>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
