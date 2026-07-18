"use client";

import { useActionState } from "react";
import { updateOwnPhoneAction, type ProfileActionState } from "@/server/actions/profile";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.patient.profile;

/** Eigene Telefonnummer im Patientenprofil pflegen (optional). */
export function PhoneForm({ initialPhone }: { initialPhone: string }) {
  const [state, action, pending] = useActionState<ProfileActionState, FormData>(
    updateOwnPhoneAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone" className="text-base">
          {t.phone}
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={initialPhone}
          placeholder={t.phonePlaceholder}
          maxLength={30}
          className="h-12 text-lg"
        />
        <p className="text-base text-muted-foreground">{t.phoneHint}</p>
      </div>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" disabled={pending} className="h-12 text-lg">
        {pending ? de.common.loading : t.phoneSave}
      </Button>
    </form>
  );
}
