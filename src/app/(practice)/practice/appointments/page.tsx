import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { listUpcomingAppointments } from "@/server/services/practice";
import { formatDateTime } from "@/lib/datetime";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.appointments.title };

const t = de.practice.appointments;
const statusLabels = de.patient.appointments.status;

/**
 * Kommende Termine der Praxis. Anlegen/Bearbeiten folgt in Phase 3.
 */
export default async function PracticeAppointmentsPage() {
  const session = (await getSessionContext())!;
  const appointments = await listUpcomingAppointments(
    session.memberships[0].practiceId
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-base text-muted-foreground">
            {t.empty}
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {appointments.map((a) => (
            <li key={a.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <span className="min-w-44 text-base font-semibold">
                    {formatDateTime(new Date(a.starts_at), a.timezone)}
                  </span>
                  <span className="flex-1 truncate text-base">
                    {a.patient?.full_name}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">
                    {a.therapist?.profiles?.full_name}
                  </span>
                  {a.status !== "scheduled" && (
                    <Badge variant="secondary">
                      {statusLabels[a.status as keyof typeof statusLabels] ??
                        a.status}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
