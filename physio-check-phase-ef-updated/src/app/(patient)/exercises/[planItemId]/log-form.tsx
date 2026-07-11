"use client";

import { useActionState } from "react";
import {
  logCompletionAction,
  type LogFormState,
} from "@/server/actions/exercise-logs";
import { completionStatusValues } from "@/lib/validation/exercise-logs";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { de } from "@/messages/de";

const t = de.patient.exercise;

/** Auswahl 0–10 als gut treffbare Select-Liste (Touch ≥ 48 px). */
function PainSelect({ id, name, label }: { id: string; name: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base">
        {label}
      </Label>
      <select
        id={id}
        name={name}
        defaultValue=""
        aria-describedby="pain-scale-hint"
        className="h-12 rounded-md border border-input bg-transparent px-3 text-lg shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="">{t.painNone}</option>
        {Array.from({ length: 11 }, (_, value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}

export function LogForm({
  planItemId,
  maxSets,
}: {
  planItemId: string;
  maxSets: number | null;
}) {
  const [state, formAction, isPending] = useActionState<LogFormState, FormData>(
    logCompletionAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="planItemId" value={planItemId} />
      <FormMessage error={state.error} />

      <fieldset className="flex flex-col gap-2">
        <legend className="pb-1 text-base font-semibold">{t.statusLabel}</legend>
        {completionStatusValues.map((value, index) => (
          <label
            key={value}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-4 text-lg has-checked:border-primary has-checked:bg-primary/10"
          >
            <input
              type="radio"
              name="status"
              value={value}
              defaultChecked={index === 0}
              required
              className="size-5 accent-primary"
            />
            {t.status[value]}
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor="setsCompleted" className="text-base">
          {t.setsCompletedLabel}
        </Label>
        <Input
          id="setsCompleted"
          name="setsCompleted"
          type="number"
          inputMode="numeric"
          min={0}
          max={maxSets ?? 20}
          className="h-12 text-lg"
        />
      </div>

      <PainSelect id="painBefore" name="painBefore" label={t.painBeforeLabel} />
      <PainSelect id="painAfter" name="painAfter" label={t.painAfterLabel} />
      <p id="pain-scale-hint" className="text-base text-muted-foreground">
        {t.painScaleHint}
      </p>

      <div className="flex flex-col gap-2">
        <Label htmlFor="note" className="text-base">
          {t.noteLabel}
        </Label>
        <Textarea id="note" name="note" maxLength={1000} rows={3} className="text-lg" />
      </div>

      <p className="text-base text-muted-foreground">{t.selfReportHint}</p>

      <Button type="submit" disabled={isPending} className="h-14 w-full text-lg">
        {isPending ? de.common.loading : t.submit}
      </Button>
    </form>
  );
}
