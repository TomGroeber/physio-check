"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

/**
 * Globale Fehleranzeige. Zeigt bewusst keine technischen Details –
 * die stehen in der Server-Konsole (niemals Patientendaten loggen).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-2xl font-bold">{de.errors.unexpectedTitle}</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        {de.errors.unexpectedBody}
      </p>
      <Button onClick={reset} className="h-12 text-lg">
        {de.errors.reload}
      </Button>
    </main>
  );
}
