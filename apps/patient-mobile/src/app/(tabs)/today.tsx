import { useRouter } from "expo-router";
import { View } from "react-native";
import { formatDateLong, formatTime } from "@physio-check/shared";
import {
  AppButton,
  Banner,
  Body,
  Card,
  ErrorView,
  LoadingView,
  Screen,
  Subtitle,
  Title,
} from "@/components/ui";
import { spacing } from "@/config/branding";
import { de } from "@/messages/de";
import { getTodayData } from "@/data/today";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

/**
 * Heute (Teil I1): kompakte Checkliste, dokumentiert ≠ erledigt klar
 * getrennt („eingetragen" zählt Selbstauskünfte), positive Rückmeldung
 * nur wenn wirklich alles erledigt (completed) ist.
 */
export default function Today() {
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const state = useLoad(() => getTodayData(userId), [userId]);

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

  const planned = data.exercises.reduce((sum, e) => sum + e.plannedToday, 0);
  const documented = data.exercises.reduce(
    (sum, e) => sum + Math.min(e.documentedToday, e.plannedToday),
    0
  );
  const allDocumented = planned > 0 && documented >= planned;
  const allCompleted =
    planned > 0 && data.exercises.every((e) => e.fullyCompletedToday);
  const next = data.exercises.find((e) => e.canDocument);

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
      <Title>{de.today.title}</Title>

      {state.error ? <ErrorView onRetry={state.refresh} /> : null}

      {!data.hasPlan ? (
        <Card>
          <Body>{de.today.noPlan}</Body>
        </Card>
      ) : data.exercises.length === 0 ? (
        <Card>
          <Body>{de.today.empty}</Body>
        </Card>
      ) : (
        <>
          <Body muted>{de.today.progress(documented, planned)}</Body>
          {allCompleted ? (
            <Banner kind="success">{de.today.celebrate}</Banner>
          ) : allDocumented ? (
            <Banner kind="success">{de.today.allDone}</Banner>
          ) : null}

          {next ? (
            <Card>
              <Body muted>{de.today.nextUp}</Body>
              <Subtitle>{next.title}</Subtitle>
              {next.plannedToday > 1 ? (
                <Body muted>
                  {de.today.occurrence(
                    Math.min(next.documentedToday + 1, next.plannedToday),
                    next.plannedToday
                  )}
                </Body>
              ) : null}
              <AppButton
                label={de.today.start}
                onPress={() => router.push(`/exercise/${next.planItemId}`)}
              />
            </Card>
          ) : null}

          {data.exercises.map((exercise) => (
            <Card key={exercise.planItemId}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.sm,
                }}
              >
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Body>{exercise.title}</Body>
                  {exercise.weeklyProgress ? (
                    <Body muted>
                      {de.today.weekly(
                        exercise.weeklyProgress.documented,
                        exercise.weeklyProgress.target
                      )}
                    </Body>
                  ) : null}
                </View>
                {exercise.fullyDocumentedToday ? (
                  <Body muted>{de.today.documented}</Body>
                ) : null}
              </View>
              {exercise.canDocument ? (
                <AppButton
                  label={de.today.start}
                  variant="secondary"
                  onPress={() => router.push(`/exercise/${exercise.planItemId}`)}
                />
              ) : null}
            </Card>
          ))}
        </>
      )}

      {data.nextAppointment ? (
        <Card>
          <Subtitle>{de.today.nextAppointment}</Subtitle>
          <Body>
            {formatDateLong(
              new Date(data.nextAppointment.startsAt),
              data.nextAppointment.timezone
            )}
            {", "}
            {formatTime(
              new Date(data.nextAppointment.startsAt),
              data.nextAppointment.timezone
            )}
          </Body>
          {data.nextAppointment.therapistName ? (
            <Body muted>
              {de.appointments.with(data.nextAppointment.therapistName)}
            </Body>
          ) : null}
          <Body muted>{data.nextAppointment.locationName}</Body>
        </Card>
      ) : null}
    </Screen>
  );
}
