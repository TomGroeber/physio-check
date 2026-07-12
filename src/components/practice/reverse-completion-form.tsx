"use client";

import { useActionState } from "react";
import {
  reverseAppointmentCompletionAction,
  type AppointmentActionState,
} from "@/server/actions/appointments";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

const t = de.practice.calendar;

/** Abschluss eines Termins zurücknehmen (bucht genau 1 Einheit zurück). */
export function ReverseCompletionForm({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState<AppointmentActionState, FormData>(
    reverseAppointmentCompletionAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl border p-4">
      <input type="hidden" name="appointmentId" value={appointmentId} />
      <h2 className="text-lg font-bold">{t.reverseTitle}</h2>
      <p className="text-sm text-muted-foreground">{t.reverseHint}</p>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" disabled={pending} variant="outline" className="h-11 text-base">
        {pending ? de.common.loading : t.reverse}
      </Button>
    </form>
  );
}
