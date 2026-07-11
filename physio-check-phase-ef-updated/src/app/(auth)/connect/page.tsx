import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  acceptInviteAction,
  connectCodeAction,
  discardPendingInviteAction,
} from "@/server/actions/invites";
import { signOutAction } from "@/server/actions/auth";
import { getPendingInvite } from "@/server/services/invites";
import { getSessionContext } from "@/server/services/session";
import { InviteCodeForm } from "@/components/auth/invite-code-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.connect.hubTitle };

/**
 * Geschützter Verbindungsbereich für angemeldete Konten.
 * Ein Konto ohne Praxisverknüpfung sieht ausschließlich diese
 * Codeeingabe, die eigenen Basisdaten und die Abmeldung – keine
 * Übungs-, Termin- oder Praxisdaten (zusätzlich per RLS abgesichert).
 * Bereits verbundene Patienten können hier die Praxis wechseln.
 */
export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, invite, { error }] = await Promise.all([
    getSessionContext(),
    getPendingInvite(),
    searchParams,
  ]);
  if (!session) redirect("/login");
  if (session.memberships.length > 0) redirect("/practice");

  const changesPractice =
    session.patientLink && invite
      ? session.patientLink.practiceId !== invite.practiceId
      : false;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">{de.connect.hubTitle}</h1>
      <p className="text-base text-muted-foreground">
        {session.patientLink
          ? de.connect.hubIntroConnected(session.patientLink.practiceName)
          : de.connect.hubIntro}
      </p>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription className="text-base">
            {de.connect.sessionExpired}
          </AlertDescription>
        </Alert>
      ) : null}

      {invite ? (
        <>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-lg font-bold">
              {de.connect.invitationFor(invite.patientDisplayName)}
            </p>
            <p className="text-base text-muted-foreground">
              {de.connect.fromPractice(invite.practiceName)}
            </p>
          </div>
          {changesPractice ? (
            <Alert className="border-warning bg-warning/15">
              <AlertDescription className="text-base text-foreground">
                {de.connect.changeWarning(session.patientLink!.practiceName)}
              </AlertDescription>
            </Alert>
          ) : null}
          <form action={acceptInviteAction}>
            <Button type="submit" className="h-12 w-full text-lg">
              {de.connect.accept}
            </Button>
          </form>
          <form action={discardPendingInviteAction}>
            <Button type="submit" variant="outline" className="h-12 w-full text-lg">
              {de.connect.enterOtherCode}
            </Button>
          </form>
        </>
      ) : (
        <InviteCodeForm action={connectCodeAction} />
      )}

      <section
        aria-label={de.connect.accountHeading}
        className="flex flex-col gap-3 rounded-lg border p-4"
      >
        <h2 className="text-base font-bold">{de.connect.accountHeading}</h2>
        <div className="text-base">
          <p className="font-semibold">{session.fullName || "–"}</p>
          <p className="break-all text-muted-foreground">{session.email ?? "–"}</p>
        </div>
        <form action={signOutAction}>
          <Button type="submit" variant="outline" className="h-12 w-full text-lg">
            {de.common.signOut}
          </Button>
        </form>
      </section>

      <p className="text-sm text-muted-foreground">{de.connect.legalHint}</p>
    </div>
  );
}
