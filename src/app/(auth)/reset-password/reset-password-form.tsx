"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type AuthFormState } from "@/server/actions/auth";
import { de } from "@/messages/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

const t = de.auth.resetPassword;

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    {}
  );

  if (state.success) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <FormMessage success={state.success} />
        <Link
          href="/login"
          className="text-base font-semibold text-primary underline underline-offset-4"
        >
          {de.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <FormMessage error={state.error} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-base">
          {t.password}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          aria-describedby="password-hint"
          className="h-12 text-lg"
        />
        <p id="password-hint" className="text-base text-muted-foreground">
          {t.passwordHint}
        </p>
      </div>
      <Button type="submit" disabled={isPending} className="h-12 w-full text-lg">
        {isPending ? de.common.loading : t.submit}
      </Button>
    </form>
  );
}
