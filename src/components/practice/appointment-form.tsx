"use client";

import { useActionState } from "react";
import {
  createAppointmentAction,
  updateAppointmentAction,
  type AppointmentActionState,
} from "@/server/actions/appointments";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { appointmentDurationsMinutes } from "@/lib/validation/appointments";
import { de } from "@/messages/de";

type Option = { id: string; fullName: string };

export function AppointmentForm({
  patients,
  therapists,
  initial,
}: {
  patients: Option[];
  therapists: Option[];
  initial: {
    appointmentId?: string;
    patientProfileId?: string;
    therapistMemberId?: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    locationName: string;
    note: string;
  };
}) {
  const isEdit = Boolean(initial.appointmentId);
  const action = isEdit ? updateAppointmentAction : createAppointmentAction;
  const [state, formAction, pending] = useActionState<AppointmentActionState, FormData>(action, {});
  const t = de.practice.calendar;

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-5">
      <FormMessage error={state.error} success={state.success} />
      {initial.appointmentId ? <input type="hidden" name="appointmentId" value={initial.appointmentId} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="patientProfileId" className="text-base">{t.patient}</Label>
          <select id="patientProfileId" name="patientProfileId" defaultValue={initial.patientProfileId} required className="h-12 rounded-md border bg-background px-3 text-base">
            <option value="">{t.selectPatient}</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="therapistMemberId" className="text-base">{t.therapist}</Label>
          <select id="therapistMemberId" name="therapistMemberId" defaultValue={initial.therapistMemberId} required className="h-12 rounded-md border bg-background px-3 text-base">
            <option value="">{t.selectTherapist}</option>
            {therapists.map((therapist) => <option key={therapist.id} value={therapist.id}>{therapist.fullName}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="date" className="text-base">{t.date}</Label>
          <Input id="date" name="date" type="date" defaultValue={initial.date} required className="h-12 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="startTime" className="text-base">{t.startTime}</Label>
          <Input id="startTime" name="startTime" type="time" step={300} defaultValue={initial.startTime} required className="h-12 text-base" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="durationMinutes" className="text-base">{t.duration}</Label>
          <select id="durationMinutes" name="durationMinutes" defaultValue={String(initial.durationMinutes)} className="h-12 rounded-md border bg-background px-3 text-base">
            {appointmentDurationsMinutes.map((minutes) => <option key={minutes} value={minutes}>{minutes} Minuten</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="locationName" className="text-base">{t.location}</Label>
        <Input id="locationName" name="locationName" defaultValue={initial.locationName} maxLength={200} className="h-12 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note" className="text-base">{t.note}</Label>
        <Textarea id="note" name="note" defaultValue={initial.note} maxLength={500} rows={4} className="text-base" />
      </div>

      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending ? de.common.loading : isEdit ? t.saveChanges : t.createAppointment}
      </Button>
    </form>
  );
}

