import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { listExerciseCategories, listPracticeExercises } from "@/server/services/exercises";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.exercises.title };

const t = de.practice.exercises;

/** Übungsbibliothek: Suche, Filter, Verwaltung. */
export default async function ExercisesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; equipment?: string; archived?: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");
  const practiceId = session.memberships[0].practiceId;
  const { q = "", category = "", equipment = "", archived } = await searchParams;
  const includeArchived = archived === "1";

  const [exercises, categories] = await Promise.all([
    listPracticeExercises(practiceId, { search: q, category, equipment, includeArchived }),
    listExerciseCategories(practiceId),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Button asChild className="h-11 text-base">
          <Link href="/practice/exercises/new">{t.addExercise}</Link>
        </Button>
      </div>

      <form method="GET" className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-end">
        <div className="flex flex-col gap-2">
          <Label htmlFor="q">{t.searchLabel}</Label>
          <Input id="q" name="q" defaultValue={q} className="h-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">{t.categoryFilter}</Label>
          <select id="category" name="category" defaultValue={category} className="h-11 rounded-md border bg-background px-3">
            <option value="">{t.allCategories}</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="equipment">{t.equipmentFilter}</Label>
          <Input id="equipment" name="equipment" defaultValue={equipment} className="h-11 w-36" />
        </div>
        <label className="flex h-11 items-center gap-2 text-base">
          <input type="checkbox" name="archived" value="1" defaultChecked={includeArchived} className="size-5" />
          {t.showArchived}
        </label>
        <Button type="submit" variant="secondary" className="h-11 text-base">
          {de.practice.patients.searchButton}
        </Button>
      </form>

      {exercises.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-base text-muted-foreground">
            {q || category || equipment || includeArchived ? t.emptyFiltered : t.empty}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {exercises.map((exercise) => (
            <li key={exercise.id}>
              <Link
                href={`/practice/exercises/${exercise.id}`}
                className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{exercise.title}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {[exercise.category, exercise.equipment].filter(Boolean).join(" · ") ||
                          exercise.description}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {exercise.exercise_media?.some((m) => m.kind === "video") ? (
                        <Badge variant="outline">{t.hasVideo}</Badge>
                      ) : null}
                      {!exercise.is_active ? <Badge variant="secondary">{t.inactive}</Badge> : null}
                      {exercise.archived_at ? <Badge variant="secondary">{t.archived}</Badge> : null}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
