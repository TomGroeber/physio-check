"use client";

import { useActionState } from "react";
import { updatePatientPhoneAction, type ProfileActionState } from "@/server/actions/profile";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.practice.patientDetail;

/** Telefonnummer eines verbundenen Patienten durch die Praxis korrigieren. */
export function PatientPhoneForm({
  patientId,
  initialPhone,
}: {
  patientId: string;
  initialPhone: string;
}) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    updatePatientPhoneAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-3 md:flex-row md:items-end">
      <input type="hidden" name="patientId" value={patientId} />
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="patient-phone">{t.phoneLabel}</Label>
        <Input
          id="patient-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          defaultValue={initialPhone}
          maxLength={30}
          className="h-11 text-base"
        />
        <p className="text-xs text-muted-foreground">{t.phoneEditHint}</p>
      </div>
      <Button type="submit" disabled={pending} variant="secondary" className="h-11">
        {pending ? de.common.loading : t.phoneSave}
      </Button>
      <div className="md:basis-full">
        <FormMessage error={state.error} success={state.success} />
      </div>
    </form>
  );
}
