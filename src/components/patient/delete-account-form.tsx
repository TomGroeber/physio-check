"use client";

import { useActionState, useState } from "react";
import {
  requestAccountDeletionAction,
  type DeleteAccountState,
} from "@/server/actions/account-deletion";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.patient.profile.deleteAccount;

/**
 * Kontolöschung im Web (Phase 4): dreifach gegen Versehen abgesichert –
 * (1) das Formular erscheint erst nach einem bewussten Klick, (2) eine
 * Checkbox muss aktiv bestätigt werden, (3) die Server-Aktion verlangt
 * zusätzlich das aktuelle Passwort (Reauthentifizierung) und lehnt
 * ohne Bestätigung ab.
 */
export function DeleteAccountForm() {
  const [expanded, setExpanded] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [state, formAction, isPending] = useActionState<
    DeleteAccountState,
    FormData
  >(requestAccountDeletionAction, {});

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="destructive"
        className="h-14 w-full text-lg"
        onClick={() => setExpanded(true)}
      >
        {t.heading}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-destructive/40 p-4">
      <FormMessage error={state.error} />
      <p className="text-base">{t.body}</p>
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border px-4 py-2 text-base has-checked:border-destructive has-checked:bg-destructive/10">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className="mt-1 size-5 accent-destructive"
          required
        />
        {t.confirmLabel}
      </label>
      <div className="flex flex-col gap-2">
        <Label htmlFor="delete-account-password" className="text-base">
          {de.auth.login.password}
        </Label>
        <Input
          id="delete-account-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 text-lg"
        />
      </div>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 flex-1 text-base"
          onClick={() => {
            setExpanded(false);
            setConfirmed(false);
          }}
        >
          {t.cancel}
        </Button>
        <Button
          type="submit"
          variant="destructive"
          disabled={!confirmed || isPending}
          className="h-12 flex-1 text-base"
        >
          {isPending ? de.common.loading : t.submit}
        </Button>
      </div>
    </form>
  );
}
