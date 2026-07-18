import type { Metadata } from "next";
import { getSessionContext } from "@/server/services/session";
import { getPatientAppointments } from "@/server/services/patient";
import { listPatientOffers } from "@/server/services/offers";
import { formatDateTime, formatTime } from "@/lib/datetime";
import { AppointmentCard } from "@/components/patient/appointment-card";
import { OfferResponse } from "@/components/patient/offer-response";
import { Card, CardContent } from "@/components/ui/card";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.patient.appointments.title };

const t = de.patient.appointments;

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ cancellation_requested?: string }>;
}) {
  const session = (await getSessionContext())!;
  const [{ upcoming, past }, offers, query] = await Promise.all([
    getPatientAppointments(session.userId),
    listPatientOffers(session.userId),
    searchParams,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>

      {query.cancellation_requested ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-success/40 bg-success/10 p-5 text-lg"
        >
          {t.cancellationRequestedBanner}
        </div>
      ) : null}

      <OfferResponse
        offers={offers.map((offer) => ({
          id: offer.id,
          whenText: `${formatDateTime(new Date(offer.starts_at), offer.timezone)} – ${formatTime(new Date(offer.ends_at), offer.timezone)}`,
          therapistName: offer.therapist?.profiles?.full_name ?? "",
          locationName: offer.location_name,
        }))}
      />

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
        <details className="rounded-xl border bg-card">
          <summary className="flex min-h-16 cursor-pointer items-center px-5 text-lg font-bold text-primary">{t.pastToggle(past.length)}</summary>
          <ul className="flex flex-col gap-3 border-t p-4">
            {past.map((a) => (
              <li key={a.id}>
                <AppointmentCard appointment={a} showMapLink={false} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
