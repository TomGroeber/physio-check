import { useLocalSearchParams, useRouter } from "expo-router";
import { View } from "react-native";
import { ExerciseLogForm } from "@/components/exercise-log-form";
import { ExerciseView } from "@/components/exercise-view";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/tab-bar";
import {
  Body,
  Card,
  ErrorView,
  LoadingView,
  PageHeading,
  Screen,
  Section,
  SuccessCircle,
  TextLink,
  useTheme,
} from "@/components/ui";
import { radius, spacing } from "@/config/branding";
import { web } from "@/messages/de";
import { getExerciseDetail } from "@/data/exercise";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

const t = web.patient.exercise;

/**
 * Übungsseite wie exercises/[planItemId]/page.tsx der Website:
 * Zurück-Link, kompakter Titel, Video-first-Ansicht, Dokumentation.
 * Nach dem Speichern geht es wie im Web zurück zu „Heute" mit
 * Erfolgsrückmeldung (?logged=…&painhint=…).
 */
export default function ExerciseScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { planItemId } = useLocalSearchParams<{ planItemId: string }>();
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const state = useLoad(
    () => getExerciseDetail(userId, planItemId ?? ""),
    [userId, planItemId]
  );

  if (state.loading && !state.data)
    return (
      <Screen bottomInset={TAB_BAR_CONTENT_HEIGHT}>
        <LoadingView />
      </Screen>
    );
  const detail = state.data;
  if (!detail)
    return (
      <Screen
        bottomInset={TAB_BAR_CONTENT_HEIGHT}
        refreshing={state.refreshing}
        onRefresh={state.refresh}
      >
        <ErrorView message={state.error ? undefined : t.errorNotFound} onRetry={state.reload} />
      </Screen>
    );

  return (
    <Screen
      bottomInset={TAB_BAR_CONTENT_HEIGHT}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    >
      <TextLink label={`‹ ${t.backToToday}`} onPress={() => router.replace("/(tabs)/today")} />
      <PageHeading>{detail.title}</PageHeading>

      <ExerciseView detail={detail} />

      <Section heading={t.documentHeading}>
        {detail.plannedToday > 1 || detail.weeklyProgress ? (
          <Body bold>
            {detail.weeklyProgress
              ? web.patient.today.progressWeek(
                  detail.weeklyProgress.documented,
                  detail.weeklyProgress.target
                )
              : web.patient.today.progressToday(
                  detail.documentedToday,
                  detail.plannedToday
                )}
          </Body>
        ) : null}
        {detail.fullyDocumentedToday ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: spacing.md,
              backgroundColor: theme.muted,
              borderRadius: radius.xl,
              padding: spacing.md + 4,
            }}
          >
            <SuccessCircle size={40} />
            <View style={{ flex: 1, gap: 2 }}>
              <Body bold>{t.alreadyLoggedTitle}</Body>
              <Body muted size="small">{t.alreadyLoggedBody}</Body>
              {!detail.fullyCompletedToday ? (
                <Body muted size="small">{t.documentedNotCompleted}</Body>
              ) : null}
            </View>
          </View>
        ) : detail.canDocument && detail.nextOccurrenceIndex ? (
          <Card>
            <ExerciseLogForm
              planItemId={detail.planItemId}
              maxSets={detail.sets}
              occurrenceIndex={detail.nextOccurrenceIndex}
              plannedOccurrences={detail.plannedToday}
              onSaved={({ status, painHint }) =>
                router.replace({
                  pathname: "/(tabs)/today",
                  params: {
                    logged: status,
                    ...(painHint ? { painhint: "1" } : {}),
                  },
                })
              }
            />
          </Card>
        ) : (
          <View
            style={{
              backgroundColor: theme.muted,
              borderRadius: radius.xl,
              padding: spacing.md + 4,
            }}
          >
            <Body muted>{t.errorNotDueToday}</Body>
          </View>
        )}
      </Section>
    </Screen>
  );
}
