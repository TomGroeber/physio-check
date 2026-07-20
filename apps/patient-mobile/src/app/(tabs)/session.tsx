import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import { View } from "react-native";
import { exerciseTimerDuration } from "@physio-check/shared";
import { ExerciseLogForm } from "@/components/exercise-log-form";
import { ExerciseTimer } from "@/components/exercise-timer";
import { ExerciseView } from "@/components/exercise-view";
import { SuccessCelebration } from "@/components/success-celebration";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/tab-bar";
import {
  AppButton,
  Banner,
  Body,
  Card,
  ErrorView,
  LoadingView,
  Screen,
  Section,
  SectionHeading,
  SuccessCircle,
  TextLink,
  Title,
  useTheme,
} from "@/components/ui";
import { spacing } from "@/config/branding";
import { web } from "@/messages/de";
import { getExerciseDetail } from "@/data/exercise";
import { getTodayData } from "@/data/today";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

const t = web.patient.session;

/**
 * Geführter Modus wie session/page.tsx der Website: immer der nächste
 * offene Durchgang, „Speichern und weiter" lädt automatisch den
 * nächsten; ohne offene Durchgänge die Tageszusammenfassung.
 */
export default function GuidedSession() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useSession();
  const params = useLocalSearchParams<{ logged?: string; painhint?: string }>();
  const userId = session?.user.id ?? "";

  const state = useLoad(async () => {
    const today = await getTodayData(userId);
    const current =
      today.exercises.find((exercise) => exercise.canDocument) ?? null;
    const detail = current
      ? await getExerciseDetail(userId, current.planItemId)
      : null;
    return { today, detail };
  }, [userId]);

  const afterSave = useCallback(
    (result: { status: string; painHint: boolean }) => {
      router.setParams({
        logged: result.status,
        painhint: result.painHint ? "1" : undefined,
      });
      state.refresh();
    },
    [router, state]
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

  const planned = data.today.exercises.reduce((sum, e) => sum + e.plannedToday, 0);
  const documented = data.today.exercises.reduce(
    (sum, e) => sum + e.documentedToday,
    0
  );
  const completed = data.today.exercises.reduce(
    (sum, e) => sum + e.completedToday,
    0
  );
  const allDocumented = planned > 0 && documented >= planned;
  const allCompleted = planned > 0 && completed >= planned;
  const detail = data.detail;
  const timerDuration = detail ? exerciseTimerDuration(detail) : null;

  return (
    <Screen
      bottomInset={TAB_BAR_CONTENT_HEIGHT}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    >
      <TextLink
        label={`‹ ${t.backToToday}`}
        onPress={() => router.replace("/(tabs)/today")}
      />
      <View style={{ gap: spacing.sm }}>
        <Title>{t.title}</Title>
        <Body>{web.patient.today.progressShort(documented, planned)}</Body>
      </View>

      <SuccessCelebration
        loggedStatus={params.logged}
        allDocumented={allDocumented}
        allCompleted={allCompleted}
      />
      {params.painhint === "1" ? (
        <Banner kind="warning">{web.patient.today.painHint}</Banner>
      ) : null}

      {detail && detail.canDocument && detail.nextOccurrenceIndex ? (
        <>
          <View style={{ gap: spacing.xs }}>
            <Body bold size="small" color={theme.primary}>
              {t.nextHeading}
            </Body>
            <Title>{detail.title}</Title>
          </View>

          <ExerciseView detail={detail} />

          {timerDuration ? <ExerciseTimer durationSeconds={timerDuration} /> : null}

          <Section heading={web.patient.exercise.documentHeading}>
            <Body muted size="small">{t.autoContinueHint}</Body>
            <Card>
              <ExerciseLogForm
                planItemId={detail.planItemId}
                maxSets={detail.sets}
                occurrenceIndex={detail.nextOccurrenceIndex}
                plannedOccurrences={detail.plannedToday}
                mode="guided"
                onSaved={afterSave}
              />
            </Card>
          </Section>
        </>
      ) : (
        <Card>
          <View style={{ alignItems: "center", gap: spacing.md }}>
            <SuccessCircle size={56} />
            <SectionHeading>{t.summaryTitle}</SectionHeading>
            <Body center>{planned > 0 ? t.summaryDone : t.noSessionToday}</Body>
            <Body bold center>{t.progress(documented, planned)}</Body>
            <Body muted size="small" center>
              {t.completedProgress(completed, planned)}
            </Body>
            {documented > completed ? (
              <Body muted size="small" center>
                {t.summaryFeedback(documented - completed)}
              </Body>
            ) : null}
          </View>
          <AppButton
            label={web.patient.today.title}
            onPress={() => router.replace("/(tabs)/today")}
          />
        </Card>
      )}
    </Screen>
  );
}
