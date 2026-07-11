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
  return <form action={action} className="flex flex-col gap-3 border-t pt-3">
    <input type="hidden" name="appointmentId" value={appointmentId} />
    <FormMessage error={state.error} success={state.success} />
    {!state.success ? <><Label htmlFor={`reason-${appointmentId}`} className="text-base">{t.cancellationReason}</Label><Input id={`reason-${appointmentId}`} name="reason" maxLength={300} className="h-11 text-base" /><Button type="submit" disabled={pending} variant="outline" className="h-11 text-base">{pending ? de.common.loading : t.requestCancellation}</Button></> : null}
  </form>;
}
