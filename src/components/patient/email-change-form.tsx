"use client";

import { useActionState } from "react";
import { changeEmailAction, type AuthFormState } from "@/server/actions/auth";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.patient.profile.security;

/**
 * E-Mail-Adresse ändern (Bereich „Sicherheit“). Die Änderung wird erst
 * wirksam, wenn beide Bestätigungs-E-Mails (bisherige und neue Adresse)
 * bestätigt wurden – bis dahin zeigt das Profil die bisherige Adresse.
 */
export function EmailChangeForm({
  currentEmail,
  pendingEmail,
}: {
  currentEmail: string;
  pendingEmail: string | null;
}) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    changeEmailAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <h3 className="text-lg font-bold">{t.changeEmailTitle}</h3>
      <div>
        <p className="text-base text-muted-foreground">{t.currentEmail}</p>
        <p className="text-lg font-bold break-all">{currentEmail}</p>
      </div>
      {pendingEmail ? (
        <FormMessage warning={t.pendingChange(pendingEmail)} />
      ) : null}
      <FormMessage error={state.error} success={state.success} />
      {!state.success ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-email" className="text-base">
              {t.newEmailLabel}
            </Label>
            <Input
              id="new-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby="new-email-hint"
              className="h-14 text-lg"
            />
          </div>
          <p id="new-email-hint" className="text-base text-muted-foreground">
            {t.changeEmailHint}
          </p>
          <Button type="submit" disabled={isPending} className="min-h-14 w-full text-lg">
            {isPending ? de.common.loading : t.changeEmailSubmit}
          </Button>
        </>
      ) : null}
    </form>
  );
}
