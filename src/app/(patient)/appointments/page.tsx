import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { getPatientAppointments } from "@/server/services/patient";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.appointments.title };

const t = de.patient.appointments;

export default async function AppointmentsPage() {
  const session = (await getSessionContext())!;
  const { upcoming, past } = await getPatientAppointments(session.userId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t.title}</h1>

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-3">
        <h2 id="upcoming-heading" className="text-xl font-bold">
          {t.upcoming}
        </h2>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-lg text-muted-foreground">
              {t.empty}
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((a) => (
              <li key={a.id}>
                <AppointmentCard appointment={a} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="flex flex-col gap-3">
          <h2 id="past-heading" className="text-xl font-bold">
            {t.past}
          </h2>
          <ul className="flex flex-col gap-3">
            {past.map((a) => (
              <li key={a.id}>
                <AppointmentCard appointment={a} showMapLink={false} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
