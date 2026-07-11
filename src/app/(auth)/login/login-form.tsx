"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type AuthFormState } from "@/server/actions/auth";
import { de } from "@/messages/de";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormMessage } from "@/components/auth/form-message";

const t = de.auth.login;

export function LoginForm({ hasPendingInvite = false }: { hasPendingInvite?: boolean }) {
  const [state, formAction, isPending] = useActionState<AuthFormState, FormData>(
    loginAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{t.title}</h1>
      {hasPendingInvite ? (
        <p className="text-base text-muted-foreground">{t.inviteIntro}</p>
      ) : null}
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
          autoComplete="current-password"
          required
          className="h-12 text-lg"
        />
        <Link
          href="/forgot-password"
          className="self-start text-base text-primary underline underline-offset-4"
        >
          {t.forgotPassword}
        </Link>
      </div>
      <Button type="submit" disabled={isPending} className="h-12 w-full text-lg">
        {isPending ? de.common.loading : t.submit}
      </Button>
      <p className="text-center text-base text-muted-foreground">
        {t.noAccount}{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline underline-offset-4"
        >
          {t.registerLink}
        </Link>
      </p>
    </form>
  );
}
