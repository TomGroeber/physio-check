import type { Metadata } from "next";
import Link from "next/link";
import { InviteCodeForm } from "@/components/auth/invite-code-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.connect.title };

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const { code = "", error } = await searchParams;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{de.connect.title}</h1>
      <p className="text-base text-muted-foreground">{de.connect.intro}</p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="text-base">
            {de.connect.sessionExpired}
          </AlertDescription>
        </Alert>
      ) : null}
      <InviteCodeForm defaultCode={code} />
      <Link
        href="/login"
        className="text-center text-base font-semibold text-primary underline underline-offset-4"
      >
        {de.landing.signIn}
      </Link>
    </div>
  );
}

