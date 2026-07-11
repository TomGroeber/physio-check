import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPendingInvite } from "@/server/services/invites";
import { getSessionContext } from "@/server/services/session";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.connect.continueTitle };

/**
 * Zwischenschritt nach geprüftem Code für nicht angemeldete Besucher:
 * Konto erstellen oder anmelden. Angemeldete Benutzer bestätigen die
 * Einladung im geschützten Verbindungsbereich (/connect).
 */
export default async function ContinueInvitePage() {
  const [invite, session] = await Promise.all([
    getPendingInvite(),
    getSessionContext(),
  ]);
  if (!invite) redirect("/invite?error=expired");
  if (session?.memberships.length) redirect("/practice");
  if (session) redirect("/connect");

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{de.connect.continueTitle}</h1>
      <div className="rounded-lg bg-muted p-4">
        <p className="text-lg font-bold">
          {de.connect.invitationFor(invite.patientDisplayName)}
        </p>
        <p className="text-base text-muted-foreground">
          {de.connect.fromPractice(invite.practiceName)}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button asChild className="h-12 text-lg">
          <Link href="/register">{de.connect.createAccount}</Link>
        </Button>
        <Button asChild variant="outline" className="h-12 text-lg">
          <Link href="/login?invite=1">{de.connect.useExistingAccount}</Link>
        </Button>
      </div>
    </div>
  );
}
