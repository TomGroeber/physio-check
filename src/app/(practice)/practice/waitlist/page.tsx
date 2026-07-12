import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/services/session";
import { listPatients } from "@/server/services/practice";
import { listWaitlistEntries } from "@/server/services/waitlist";
import { listFreedSlots, listPracticeOffers } from "@/server/services/offers";
import { getAppointmentOptions } from "@/server/services/appointments";
import { formatDateShort, formatDateTime, formatTime } from "@/lib/datetime";
import { branding } from "@/config/branding";
import { WaitlistPanel } from "@/components/practice/waitlist-panel";
import { OfferPanel } from "@/components/practice/offer-panel";
import { de } from "@/messages/de";

export const metadata: Metadata = { title: de.practice.waitlist.title };

const t = de.practice.waitlist;

export default async function WaitlistPage() {
  const session = await getSessionContext();
  if (!session?.memberships[0]) redirect("/login");
  const practiceId = session.memberships[0].practiceId;

  const [patients, entries, freedSlots, offers, options] = await Promise.all([
    listPatients(practiceId, ""),
    listWaitlistEntries(practiceId),
    listFreedSlots(practiceId),
    listPracticeOffers(practiceId),
    getAppointmentOptions(practiceId),
  ]);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="text-base text-muted-foreground">{t.hint}</p>
      </div>
      <WaitlistPanel
        patients={patients.map((link) => ({ id: link.patient.id, fullName: link.patient.full_name }))}
        entries={entries.map((entry) => ({
          ...entry,
          createdAtText: formatDateShort(new Date(entry.created_at), branding.defaultTimeZone),
          resolvedAtText: entry.resolved_at
            ? formatDateShort(new Date(entry.resolved_at), branding.defaultTimeZone)
            : null,
        }))}
      />
      <OfferPanel
        patients={patients.map((link) => ({ id: link.patient.id, fullName: link.patient.full_name }))}
        therapists={options.therapists.map((row) => ({ id: row.id, fullName: row.profiles.full_name }))}
        freedSlots={freedSlots.map((slot) => ({
          id: slot.id,
          text: `${formatDateTime(new Date(slot.starts_at), slot.timezone)} – ${formatTime(new Date(slot.ends_at), slot.timezone)}${slot.therapist?.profiles?.full_name ? ` · ${slot.therapist.profiles.full_name}` : ""}`,
        }))}
        offers={offers.map((offer) => ({
          id: offer.id,
          status: offer.status,
          patientName: offer.patient?.full_name ?? "Unbekannt",
          therapistName: offer.therapist?.profiles?.full_name ?? "",
          whenText: `${formatDateTime(new Date(offer.starts_at), offer.timezone)} – ${formatTime(new Date(offer.ends_at), offer.timezone)}`,
        }))}
      />
    </div>
  );
}
