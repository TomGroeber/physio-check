"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createPatientInviteAction,
  type CreatePatientInviteState,
} from "@/server/actions/invites";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

const t = de.practice.patients;

export function PatientInviteForm({
  defaultName = "",
  replaceInviteId,
}: {
  defaultName?: string;
  replaceInviteId?: string;
}) {
  const [state, action, pending] = useActionState<
    CreatePatientInviteState,
    FormData
  >(createPatientInviteAction, {});

  if (state.code && state.inviteLink) {
    return (
      <div className="flex flex-col gap-5">
        <FormMessage success={t.inviteCreated} />
        <p className="text-base text-muted-foreground">{t.inviteOneTime}</p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="created-code" className="text-base">{t.inviteCode}</Label>
          <Input id="created-code" readOnly value={state.code} className="h-12 font-mono text-lg tracking-widest" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="created-link" className="text-base">{t.inviteLink}</Label>
          <Input id="created-link" readOnly value={state.inviteLink} className="h-12 text-base" />
        </div>
        <Button asChild variant="outline" className="h-12 text-base">
          <Link href="/practice/patients">{de.common.back}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage error={state.error} />
      {replaceInviteId ? (
        <input type="hidden" name="replaceInviteId" value={replaceInviteId} />
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="patientDisplayName" className="text-base">
          {t.patientName}
        </Label>
        <Input
          id="patientDisplayName"
          name="patientDisplayName"
          defaultValue={defaultName}
          required
          readOnly={Boolean(replaceInviteId)}
          className="h-12 text-lg"
        />
      </div>
      <Button type="submit" disabled={pending} className="h-12 text-base">
        {pending
          ? de.common.loading
          : replaceInviteId
            ? t.renewInvite
            : t.createInvite}
      </Button>
    </form>
  );
}

