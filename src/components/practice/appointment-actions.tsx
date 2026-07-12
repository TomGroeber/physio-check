"use client";

import { useActionState } from "react";
import {
  cancelAppointmentAction,
  completeAppointmentAction,
  type AppointmentActionState,
} from "@/server/actions/appointments";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

export function AppointmentActions({
  appointmentId,
  noUnitsAvailable,
}: {
  appointmentId: string;
  noUnitsAvailable?: boolean;
}) {
  const [cancelState, cancelAction, cancelling] = useActionState<AppointmentActionState, FormData>(cancelAppointmentAction, {});
  const [completeState, completeAction, completing] = useActionState<AppointmentActionState, FormData>(completeAppointmentAction, {});
  const t = de.practice.calendar;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form action={completeAction} className="flex flex-col gap-3 rounded-xl border p-4">
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <h2 className="text-lg font-bold">{t.completeTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.completeHint}</p>
        {noUnitsAvailable ? <FormMessage warning={t.zeroUnitsWarning} /> : null}
        <FormMessage error={completeState.error} success={completeState.success} warning={completeState.warning} />
        <Button type="submit" disabled={completing} variant="secondary" className="h-11 text-base">
          {completing ? de.common.loading : t.complete}
        </Button>
      </form>

      <form action={cancelAction} className="flex flex-col gap-3 rounded-xl border border-destructive/30 p-4">
        <input type="hidden" name="appointmentId" value={appointmentId} />
        <h2 className="text-lg font-bold">{t.cancelTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.cancelHint}</p>
        <FormMessage error={cancelState.error} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="reason" className="text-base">{t.cancelReason}</Label>
          <Input id="reason" name="reason" maxLength={300} className="h-11 text-base" />
        </div>
        <Button type="submit" disabled={cancelling} variant="destructive" className="h-11 text-base">
          {cancelling ? de.common.loading : t.cancelAppointment}
        </Button>
      </form>
    </div>
  );
}

