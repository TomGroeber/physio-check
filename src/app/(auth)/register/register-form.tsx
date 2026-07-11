"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type AuthFormState } from "@/server/actions/auth";
import { de } from "@/messages/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

const t = de.auth.register;

export function RegisterForm({
  practiceName,
  patientDisplayName,
}: {
  practiceName: string;
  patientDisplayName: string;
}) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    registerAction,
    {}
  );

  // Nach erfolgreicher Registrierung nur den Hinweis zeigen – der
  // nächste Schritt passiert im E-Mail-Postfach.
  if (state.success) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <FormMessage success={state.success} />
        <Link
          href="/login"
          className="text-base font-semibold text-primary underline underline-offset-4"
        >
          {t.loginLink}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      <p className="text-base text-muted-foreground">{t.intro(practiceName)}</p>
      <p className="rounded-lg bg-muted p-3 text-base font-semibold">
        {t.invitedAs(patientDisplayName)}
      </p>
      <FormMessage error={state.error} />
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
      <p className="text-center text-base text-muted-foreground">
        {t.hasAccount}{" "}
        <Link
          href="/login"
          className="font-semibold text-primary underline underline-offset-4"
        >
          {t.loginLink}
        </Link>
      </p>
    </form>
  );
}
