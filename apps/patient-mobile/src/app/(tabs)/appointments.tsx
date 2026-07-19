import { useState } from "react";
import { formatDateLong, formatTime } from "@physio-check/shared";
import {
  AppButton,
  Banner,
  Body,
  Card,
  ErrorView,
  Field,
  LoadingView,
  Screen,
  Subtitle,
  Title,
} from "@/components/ui";
import { de } from "@/messages/de";
import {
  acceptOffer,
  declineOffer,
  getAppointments,
  getOpenOffers,
  getUnitSummary,
  requestCancellation,
  type AppointmentView,
} from "@/data/appointments";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

function AppointmentCard({
  appointment,
  onRequestCancellation,
}: {
  appointment: AppointmentView;
  onRequestCancellation?: (id: string, reason: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const cancellable =
    onRequestCancellation && appointment.status === "scheduled";

  return (
    <Card>
      <Body>
        {formatDateLong(new Date(appointment.startsAt), appointment.timezone)}
        {", "}
        {formatTime(new Date(appointment.startsAt), appointment.timezone)}
      </Body>
      {appointment.therapistName ? (
        <Body muted>{de.appointments.with(appointment.therapistName)}</Body>
      ) : null}
      <Body muted>
        {[appointment.locationName, appointment.address]
          .filter(Boolean)
          .join(" · ")}
      </Body>
      <Body muted>
        {de.appointments.status[appointment.status] ?? appointment.status}
      </Body>
      {cancellable ? (
        open ? (
          <>
            <Field
              label={de.appointments.cancellationReason}
              value={reason}
              onChangeText={setReason}
            />
            <AppButton
              label={pending ? de.common.loading : de.appointments.cancellationSend}
              disabled={pending}
              onPress={async () => {
                setPending(true);
                try {
                  await onRequestCancellation(appointment.id, reason);
                } finally {
                  setPending(false);
                }
              }}
            />
            <AppButton
              label={de.common.cancel}
              variant="secondary"
              onPress={() => setOpen(false)}
            />
          </>
        ) : (
          <AppButton
            label={de.appointments.requestCancellation}
            variant="secondary"
            onPress={() => setOpen(true)}
          />
        )
      ) : null}
    </Card>
  );
}

/** Termine (Teil I3/I4) inkl. Angebote und Behandlungseinheiten. */
export default function Appointments() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const [showPast, setShowPast] = useState(false);
  const [message, setMessage] = useState<{
    kind: "success" | "warning";
    text: string;
  } | null>(null);

  const state = useLoad(
    async () => ({
      appointments: await getAppointments(userId),
      offers: await getOpenOffers(userId),
      units: await getUnitSummary(userId),
    }),
    [userId]
  );

  if (state.loading && !state.data)
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  const data = state.data;
  if (!data)
    return (
      <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
        <ErrorView onRetry={state.reload} />
      </Screen>
    );

  const cancellation = async (id: string, reason: string) => {
    await requestCancellation(id, reason);
    setMessage({ kind: "success", text: de.appointments.cancellationRequested });
    state.refresh();
  };

  const lowUnits =
    data.units && data.units.remaining <= 2 && data.units.remaining > 0;
  const expired =
    data.units?.validUntil && new Date(data.units.validUntil) < new Date();

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
      <Title>{de.appointments.title}</Title>
      {message ? <Banner kind={message.kind}>{message.text}</Banner> : null}
      {state.error ? <ErrorView onRetry={state.refresh} /> : null}

      {data.offers.length > 0 ? (
        <>
          <Subtitle>{de.appointments.offers}</Subtitle>
          {data.offers.map((offer) => (
            <Card key={offer.id}>
              <Body muted>{de.appointments.offerBody(offer.practiceName)}</Body>
              <Body>
                {formatDateLong(new Date(offer.startsAt), offer.timezone)}
                {", "}
                {formatTime(new Date(offer.startsAt), offer.timezone)}
              </Body>
              {offer.locationName ? <Body muted>{offer.locationName}</Body> : null}
              <AppButton
                label={de.appointments.offerAccept}
                onPress={async () => {
                  const booked = await acceptOffer(offer.id).catch(() => null);
                  if (booked === null) {
                    setMessage({ kind: "warning", text: de.common.error });
                  } else if (booked) {
                    setMessage({ kind: "success", text: de.appointments.offerAccepted });
                  } else {
                    setMessage({ kind: "warning", text: de.appointments.offerConflict });
                  }
                  state.refresh();
                }}
              />
              <AppButton
                label={de.appointments.offerDecline}
                variant="secondary"
                onPress={async () => {
                  await declineOffer(offer.id).catch(() => null);
                  setMessage({ kind: "success", text: de.appointments.offerDeclined });
                  state.refresh();
                }}
              />
            </Card>
          ))}
        </>
      ) : null}

      <Subtitle>{de.appointments.upcoming}</Subtitle>
      {data.appointments.upcoming.length === 0 ? (
        <Card>
          <Body muted>{de.appointments.empty}</Body>
        </Card>
      ) : (
        data.appointments.upcoming.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onRequestCancellation={cancellation}
          />
        ))
      )}

      <Card>
        <Subtitle>{de.appointments.units.title}</Subtitle>
        {data.units ? (
          <>
            <Body>
              {de.appointments.units.remaining(
                data.units.remaining,
                data.units.adjustedTotal
              )}
            </Body>
            {expired ? (
              <Banner kind="warning">{de.appointments.units.expired}</Banner>
            ) : lowUnits ? (
              <Banner kind="warning">{de.appointments.units.low}</Banner>
            ) : null}
            <Body muted>{de.appointments.units.hint}</Body>
          </>
        ) : (
          <Body muted>{de.appointments.units.none}</Body>
        )}
      </Card>

      {data.appointments.past.length > 0 ? (
        <>
          <AppButton
            label={showPast ? de.appointments.hidePast : de.appointments.showPast}
            variant="secondary"
            onPress={() => setShowPast((value) => !value)}
          />
          {showPast
            ? data.appointments.past.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            : null}
        </>
      ) : null}
    </Screen>
  );
}
