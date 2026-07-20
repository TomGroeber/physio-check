import { useState } from "react";
import { View } from "react-native";
import { formatDateTime, formatTime } from "@physio-check/shared";
import { AppointmentCard } from "@/components/appointment-card";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/tab-bar";
import {
  AppButton,
  Banner,
  Body,
  Card,
  Collapsible,
  ErrorView,
  LoadingView,
  Screen,
  Section,
  Title,
} from "@/components/ui";
import { spacing } from "@/config/branding";
import { app, web } from "@/messages/de";
import {
  acceptOffer,
  declineOffer,
  getAppointments,
  getOpenOffers,
} from "@/data/appointments";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

const t = web.patient.appointments;

/** Termine wie appointments/page.tsx der Website. */
export default function Appointments() {
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const [message, setMessage] = useState<{
    kind: "success" | "warning";
    text: string;
  } | null>(null);
  const [offerPending, setOfferPending] = useState(false);

  const state = useLoad(
    async () => ({
      appointments: await getAppointments(userId),
      offers: await getOpenOffers(userId),
    }),
    [userId]
  );

  if (state.loading && !state.data)
    return (
      <Screen bottomInset={TAB_BAR_CONTENT_HEIGHT}>
        <LoadingView />
      </Screen>
    );
  const data = state.data;
  if (!data)
    return (
      <Screen
        bottomInset={TAB_BAR_CONTENT_HEIGHT}
        refreshing={state.refreshing}
        onRefresh={state.refresh}
      >
        <ErrorView onRetry={state.reload} />
      </Screen>
    );

  return (
    <Screen
      bottomInset={TAB_BAR_CONTENT_HEIGHT}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    >
      <Title>{t.title}</Title>

      {message ? <Banner kind={message.kind}>{message.text}</Banner> : null}

      {data.offers.length > 0 ? (
        <Section heading={t.offersHeading}>
          <Body muted size="small">{t.offersHint}</Body>
          {data.offers.map((offer) => (
            <Card key={offer.id}>
              <Body bold>
                {formatDateTime(new Date(offer.startsAt), offer.timezone)} –{" "}
                {formatTime(new Date(offer.endsAt), offer.timezone)}
              </Body>
              <Body muted size="small">
                {[
                  offer.therapistName
                    ? `${web.patient.today.with} ${offer.therapistName}`
                    : "",
                  offer.locationName,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Body>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label={t.acceptOffer}
                    disabled={offerPending}
                    onPress={async () => {
                      setOfferPending(true);
                      try {
                        const booked = await acceptOffer(offer.id);
                        setMessage(
                          booked
                            ? { kind: "success", text: app.offers.accepted }
                            : { kind: "warning", text: app.offers.conflict }
                        );
                      } catch {
                        setMessage({ kind: "warning", text: web.common.error });
                      } finally {
                        setOfferPending(false);
                        state.refresh();
                      }
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton
                    label={t.declineOffer}
                    variant="outline"
                    disabled={offerPending}
                    onPress={async () => {
                      setOfferPending(true);
                      try {
                        await declineOffer(offer.id);
                        setMessage({ kind: "success", text: app.offers.declined });
                      } catch {
                        setMessage({ kind: "warning", text: web.common.error });
                      } finally {
                        setOfferPending(false);
                        state.refresh();
                      }
                    }}
                  />
                </View>
              </View>
            </Card>
          ))}
        </Section>
      ) : null}

      <Section heading={t.upcoming}>
        {data.appointments.upcoming.length === 0 ? (
          <Card>
            <Body muted>{t.empty}</Body>
          </Card>
        ) : (
          data.appointments.upcoming.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCancellationRequested={() => {
                setMessage({ kind: "success", text: t.cancellationRequestedBanner });
                state.refresh();
              }}
            />
          ))
        )}
      </Section>

      {data.appointments.past.length > 0 ? (
        <Collapsible summary={t.pastToggle(data.appointments.past.length)}>
          <View style={{ gap: spacing.md - 4 }}>
            {data.appointments.past.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                showActions={false}
              />
            ))}
          </View>
        </Collapsible>
      ) : null}
    </Screen>
  );
}
