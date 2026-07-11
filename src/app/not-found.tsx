import Link from "next/link";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 text-center">
      <h1 className="text-2xl font-bold">{de.errors.notFoundTitle}</h1>
      <p className="max-w-md text-lg text-muted-foreground">
        {de.errors.notFoundBody}
      </p>
      <Button asChild className="h-12 text-lg">
        <Link href="/">{de.errors.toHome}</Link>
      </Button>
    </main>
  );
}
