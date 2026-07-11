"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type AuthFormState } from "@/server/actions/auth";
import { de } from "@/messages/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

const t = de.auth.forgotPassword;

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    forgotPasswordAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p className="text-base text-muted-foreground">{t.intro}</p>
      <FormMessage error={state.error} success={state.success} />
      {!state.success && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-base">
              {t.email}
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-12 text-lg"
            />
          </div>
          <Button type="submit" disabled={isPending} className="h-12 w-full text-lg">
            {isPending ? de.common.loading : t.submit}
          </Button>
        </>
      )}
      <Link
        href="/login"
        className="text-center text-base text-primary underline underline-offset-4"
      >
        {t.backToLogin}
      </Link>
    </form>
  );
}
