import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { listOpenPatientInvites, listPatients } from "@/server/services/practice";
import { listAuthorizationWarningsForPractice } from "@/server/services/authorizations";
import { Badge } from "@/components/ui/badge";
import { revokePatientInviteAction } from "@/server/actions/invites";
import { formatDateShort } from "@/lib/datetime";
import { branding } from "@/config/branding";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.patients.title };

const t = de.practice.patients;

/**
 * Patientenliste mit serverseitiger Namenssuche (GET-Formular, damit
 * die Suche verlinkbar und ohne JavaScript nutzbar ist).
 * Offene Einladungen können erstellt, widerrufen und erneuert werden.
 */
export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; warn?: string }>;
}) {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");
  const { q = "", warn } = await searchParams;
  const onlyWarnings = warn === "1";
  const practiceId = session.memberships[0].practiceId;
  const [allPatients, invites, authorizationWarnings] = await Promise.all([
    listPatients(practiceId, q),
    listOpenPatientInvites(practiceId),
    listAuthorizationWarningsForPractice(practiceId, branding.defaultTimeZone),
  ]);
  const warningPatientIds = new Set(authorizationWarnings.map((entry) => entry.patientId));
  const patients = onlyWarnings
    ? allPatients.filter((link) => warningPatientIds.has(link.patient.id))
    : allPatients;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Button asChild className="h-11 text-base">
          <Link href="/practice/patients/new">{t.addPatient}</Link>
        </Button>
      </div>

      <form method="GET" className="flex items-end gap-2">
        <div className="flex flex-1 flex-col gap-2">
          <Label htmlFor="q" className="text-base">
            {t.searchLabel}
          </Label>
          <Input
            id="q"
            name="q"
            defaultValue={q}
            placeholder={t.searchPlaceholder}
            className="h-11 text-base"
          />
        </div>
        <Button type="submit" variant="secondary" className="h-11 text-base">
          {t.searchButton}
        </Button>
      </form>

      <form method="GET" className="flex items-center gap-2">
        {q ? <input type="hidden" name="q" value={q} /> : null}
        {onlyWarnings ? null : <input type="hidden" name="warn" value="1" />}
        <Button type="submit" variant={onlyWarnings ? "default" : "outline"} className="h-11 text-base">
          {t.warningFilterLabel}
          {onlyWarnings ? " ✕" : ""}
        </Button>
      </form>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-base text-muted-foreground">
            {t.empty}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {patients.map((link) => (
            <li key={link.id}>
              <Link
                href={`/practice/patients/${link.patient.id}`}
                className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <span className="flex flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold">
                          {link.patient.full_name}
                        </span>
                        {warningPatientIds.has(link.patient.id) ? (
                          <Badge className="border-amber-600/50 bg-amber-500/10 text-foreground">
                            {t.warningBadge}
                          </Badge>
                        ) : null}
                      </span>
                      {link.patient.phone ? (
                        <span className="text-sm text-muted-foreground">
                          {link.patient.phone}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t.connectedSince(
                        formatDateShort(
                          new Date(link.linked_at),
                          branding.defaultTimeZone
                        )
                      )}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="flex flex-col gap-3" aria-labelledby="pending-invites-heading">
        <h2 id="pending-invites-heading" className="text-xl font-bold">
          {t.pendingInvites}
        </h2>
        {invites.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-base text-muted-foreground">
              {t.noPendingInvites}
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {invites.map((invite) => (
              <li key={invite.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-base font-semibold">{invite.patient_display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.validUntil(
                          formatDateShort(new Date(invite.expires_at), branding.defaultTimeZone)
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" className="h-10 text-sm">
                        <Link href={`/practice/patients/new?replace=${invite.id}`}>
                          {t.renewInvite}
                        </Link>
                      </Button>
                      <form action={revokePatientInviteAction}>
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <Button type="submit" variant="destructive" className="h-10 text-sm">
                          {t.revokeInvite}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
