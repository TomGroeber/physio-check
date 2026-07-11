"use client";

import { useActionState } from "react";
import { startInviteAction, type InviteEntryState } from "@/server/actions/invites";
import { FormMessage } from "@/components/auth/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { de } from "@/messages/de";

export function InviteCodeForm({
  defaultCode = "",
  action: serverAction = startInviteAction,
}: {
  defaultCode?: string;
  /** Alternative Server Action, z. B. für den angemeldeten Verbindungsbereich. */
  action?: (state: InviteEntryState, formData: FormData) => Promise<InviteEntryState>;
}) {
  const [state, action, pending] = useActionState<InviteEntryState, FormData>(
    serverAction,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage error={state.error} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-code" className="text-base">
          {de.connect.codeLabel}
        </Label>
        <Input
          id="invite-code"
          name="code"
          defaultValue={defaultCode}
          placeholder={de.connect.codePlaceholder}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
          className="h-12 font-mono text-lg tracking-widest"
        />
      </div>
      <Button type="submit" disabled={pending} className="h-12 w-full text-lg">
        {pending ? de.common.loading : de.connect.submit}
      </Button>
    </form>
  );
}

