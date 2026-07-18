"use client";

import { useActionState } from "react";
import {
  requestPasswordChangeAction,
  type AuthFormState,
} from "@/server/actions/auth";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

const t = de.patient.profile.security;

/**
 * Passwort ändern (Bereich „Sicherheit“): eine große Schaltfläche ohne
 * E-Mail-Feld. Der Server leitet die Adresse aus der Session ab und
 * verschickt den bestehenden sicheren Wiederherstellungslink.
 */
export function PasswordChangeForm() {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    requestPasswordChangeAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <h3 className="text-lg font-bold">{t.changePasswordTitle}</h3>
      <p className="text-base text-muted-foreground">{t.changePasswordHint}</p>
      <FormMessage error={state.error} success={state.success} />
      {!state.success ? (
        <Button type="submit" disabled={isPending} className="min-h-14 w-full text-lg">
          {isPending ? de.common.loading : t.changePasswordSubmit}
        </Button>
      ) : null}
    </form>
  );
}
