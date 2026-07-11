import Link from "next/link";
import type { Metadata } from "next";
import { de } from "@/messages/de";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: de.auth.confirm.errorTitle };

/** Zielseite, wenn ein Bestätigungslink ungültig oder abgelaufen ist. */
export default function AuthErrorPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-2xl font-bold">{de.auth.confirm.errorTitle}</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        {de.auth.confirm.errorBody}
      </p>
      <Button asChild className="h-12 text-lg">
        <Link href="/login">{de.auth.confirm.toLogin}</Link>
      </Button>
    </main>
  );
}
