"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  redeemPracticeMemberRecoveryAction,
  type PracticeRecoveryFormState,
} from "@/server/actions/practice-recovery";
import { de } from "@/messages/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

const t = de.admin.practiceRecovery;

export function RecoveryForm({ token }: { token: string }) {
  const action = redeemPracticeMemberRecoveryAction.bind(null, token);
  const [state, formAction, isPending] = useActionState<PracticeRecoveryFormState, FormData>(
    action,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage error={state.error} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t.passwordLabel}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-sm text-muted-foreground">
          {t.passwordHint}
        </p>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? de.common.loading : t.submitCta}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
          {t.loginCta}
        </Link>
      </p>
    </form>
  );
}
