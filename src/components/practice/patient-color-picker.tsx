"use client";

import { useActionState } from "react";
import {
  setPatientCalendarColorAction,
  type PatientColorState,
} from "@/server/actions/patient-calendar-colors";
import { CALENDAR_COLORS, calendarColorStyles, type CalendarColor } from "@/lib/calendar-colors";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

const t = de.practice.patientDetail.calendarColor;

/**
 * Kalenderfarbe eines Patienten wählen. Jede Option zeigt Farbfeld UND
 * Farbname (nie nur Farbe, WCAG 1.4.1); „Keine Farbe“ entfernt die
 * Zuordnung wieder.
 */
export function PatientColorPicker({
  patientId,
  currentColor,
}: {
  patientId: string;
  currentColor: CalendarColor | null;
}) {
  const [state, action, pending] = useActionState<PatientColorState, FormData>(
    setPatientCalendarColorAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="patientId" value={patientId} />
      <p className="text-sm text-muted-foreground">{t.hint}</p>
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">{t.heading}</legend>
        {CALENDAR_COLORS.map((color) => {
          const style = calendarColorStyles[color];
          return (
            <label
              key={color}
              className="flex h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 text-base has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:font-bold"
            >
              <input
                type="radio"
                name="color"
                value={color}
                defaultChecked={color === currentColor}
                className="sr-only"
              />
              <span aria-hidden className={`size-4 rounded-full ${style.swatch}`} />
              {style.label}
            </label>
          );
        })}
        <label className="flex h-12 cursor-pointer items-center gap-2 rounded-lg border px-3 text-base has-[:checked]:border-primary has-[:checked]:bg-primary/10 has-[:checked]:font-bold">
          <input
            type="radio"
            name="color"
            value="none"
            defaultChecked={currentColor === null}
            className="sr-only"
          />
          <span aria-hidden className="size-4 rounded-full border-2 border-muted-foreground" />
          {t.none}
        </label>
      </fieldset>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" disabled={pending} variant="secondary" className="h-11 self-start">
        {pending ? de.common.loading : t.save}
      </Button>
    </form>
  );
}
