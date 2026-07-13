"use client";

import { useActionState } from "react";
import {
  createExerciseAction,
  updateExerciseAction,
  type ExerciseActionState,
} from "@/server/actions/exercises";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/messages/de";

const t = de.practice.exercises;
const f = t.fields;

export type ExerciseFormValues = {
  exerciseId?: string;
  title?: string;
  description?: string;
  startingPosition?: string;
  stepsText?: string;
  commonMistakes?: string;
  equipment?: string;
  category?: string;
  defaultDosageType?: "repetitions" | "duration";
  defaultSets?: number | null;
  defaultRepetitions?: number | null;
  defaultHoldSeconds?: number | null;
  defaultTotalDurationSeconds?: number | null;
  defaultRestSeconds?: number | null;
};

function NumberField({
  id,
  name,
  label,
  defaultValue,
  min,
  max,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: number | null;
  min: number;
  max: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type="number"
        min={min}
        max={max}
        defaultValue={defaultValue ?? ""}
        className="h-11"
      />
    </div>
  );
}

/** Anlegen/Bearbeiten einer Übung der Praxisbibliothek. */
export function ExerciseForm({ initial }: { initial: ExerciseFormValues }) {
  const isEdit = Boolean(initial.exerciseId);
  const [state, action, pending] = useActionState<ExerciseActionState, FormData>(
    isEdit ? updateExerciseAction : createExerciseAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      {isEdit ? <input type="hidden" name="exerciseId" value={initial.exerciseId} /> : null}
      <FormMessage error={state.error} success={state.success} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="exercise-title">{f.title}</Label>
          <Input id="exercise-title" name="title" required maxLength={200} defaultValue={initial.title ?? ""} className="h-11 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exercise-category">{f.category}</Label>
          <Input id="exercise-category" name="category" maxLength={100} placeholder={f.categoryPlaceholder} defaultValue={initial.category ?? ""} className="h-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="exercise-equipment">{f.equipment}</Label>
          <Input id="exercise-equipment" name="equipment" maxLength={300} defaultValue={initial.equipment ?? ""} className="h-11" />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="exercise-description">{f.description}</Label>
          <Textarea id="exercise-description" name="description" maxLength={1000} rows={2} defaultValue={initial.description ?? ""} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="exercise-starting">{f.startingPosition}</Label>
          <Textarea id="exercise-starting" name="startingPosition" maxLength={500} rows={2} defaultValue={initial.startingPosition ?? ""} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="exercise-steps">{f.steps}</Label>
          <Textarea id="exercise-steps" name="stepsText" maxLength={4000} rows={5} defaultValue={initial.stepsText ?? ""} />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="exercise-mistakes">{f.commonMistakes}</Label>
          <Textarea id="exercise-mistakes" name="commonMistakes" maxLength={1000} rows={2} defaultValue={initial.commonMistakes ?? ""} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="exercise-dosage">{f.dosageType}</Label>
          <select
            id="exercise-dosage"
            name="defaultDosageType"
            defaultValue={initial.defaultDosageType ?? "repetitions"}
            className="h-11 rounded-md border bg-background px-3"
          >
            <option value="repetitions">{f.dosageRepetitions}</option>
            <option value="duration">{f.dosageDuration}</option>
          </select>
        </div>
        <NumberField id="exercise-sets" name="defaultSets" label={f.sets} defaultValue={initial.defaultSets} min={1} max={20} />
        <NumberField id="exercise-reps" name="defaultRepetitions" label={f.repetitions} defaultValue={initial.defaultRepetitions} min={1} max={100} />
        <NumberField id="exercise-hold" name="defaultHoldSeconds" label={f.holdSeconds} defaultValue={initial.defaultHoldSeconds} min={1} max={600} />
        <NumberField id="exercise-duration" name="defaultTotalDurationSeconds" label={f.totalDurationSeconds} defaultValue={initial.defaultTotalDurationSeconds} min={1} max={3600} />
        <NumberField id="exercise-rest" name="defaultRestSeconds" label={f.restSeconds} defaultValue={initial.defaultRestSeconds} min={0} max={600} />
      </div>

      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? de.common.loading : isEdit ? t.save : t.create}
      </Button>
    </form>
  );
}
