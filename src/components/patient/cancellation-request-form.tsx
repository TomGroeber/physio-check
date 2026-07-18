"use client";

import { useActionState } from "react";
import { requestAppointmentCancellationAction, type AppointmentActionState } from "@/server/actions/appointments";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

export function CancellationRequestForm({ appointmentId }: { appointmentId: string }) {
  const [state, action, pending] = useActionState<AppointmentActionState, FormData>(requestAppointmentCancellationAction, {});
  const t = de.patient.appointments;
  return (
    <div className="border-t pt-3">
      <FormMessage error={state.error} success={state.success} />
      {!state.success ? (
        <details className="rounded-xl border">
          <summary className="flex min-h-14 cursor-pointer items-center px-4 text-lg font-bold text-primary">{t.cancelToggle}</summary>
          <form action={action} className="flex flex-col gap-3 border-t p-4">
            <input type="hidden" name="appointmentId" value={appointmentId} />
            <Label htmlFor={`reason-${appointmentId}`} className="text-base">{t.cancellationReason}</Label>
            <Input id={`reason-${appointmentId}`} name="reason" maxLength={300} className="h-12 text-lg" />
            <Button type="submit" disabled={pending} variant="outline" className="min-h-14 text-lg">{pending ? de.common.loading : t.requestCancellation}</Button>
          </form>
        </details>
      ) : null}
    </div>
  );
}
