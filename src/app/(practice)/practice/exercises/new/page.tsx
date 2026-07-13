import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { ExerciseForm } from "@/components/practice/exercise-form";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.exercises.newTitle };

export default async function NewExercisePage() {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Link href="/practice/exercises" className="font-semibold text-primary">
        ← {de.common.back}
      </Link>
      <h1 className="text-2xl font-bold">{de.practice.exercises.newTitle}</h1>
      <ExerciseForm initial={{}} />
    </div>
  );
}
