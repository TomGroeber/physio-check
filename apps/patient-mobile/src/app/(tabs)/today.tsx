import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { AppointmentCard } from "@/components/appointment-card";
import { SuccessCelebration } from "@/components/success-celebration";
import { TAB_BAR_CONTENT_HEIGHT } from "@/components/tab-bar";
import {
  AppButton,
  Banner,
  Body,
  Card,
  Collapsible,
  ErrorView,
  ExerciseMark,
  LoadingView,
  PageHeading,
  ProgressBar,
  Screen,
  Section,
  SuccessCircle,
  TextLink,
  useTheme,
} from "@/components/ui";
import { spacing } from "@/config/branding";
import { web } from "@/messages/de";
import {
  getReminderData,
  getTodayData,
  markNotificationRead,
} from "@/data/today";
import { getUnitSummary } from "@/data/appointments";
import { prescriptionSummary, progressLine } from "@/lib/format";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

const t = web.patient.today;

/** Heute-Ansicht: identische Informationsarchitektur wie today/page.tsx der Website. */
export default function Today() {
  const router = useRouter();
  const theme = useTheme();
  const { session, fullName } = useSession();
  const params = useLocalSearchParams<{ logged?: string; painhint?: string }>();
  const userId = session?.user.id ?? "";

  const state = useLoad(async () => {
    const today = await getTodayData(userId);
    const planned = today.exercises.reduce((sum, e) => sum + e.plannedToday, 0);
    const documented = today.exercises.reduce((sum, e) => sum + e.documentedToday, 0);
    const [reminders, authorization] = await Promise.all([
      getReminderData(userId, today.timezone, Math.max(0, planned - documented)),
      getUnitSummary(userId),
    ]);
    return { today, reminders, authorization };
  }, [userId]);

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

  const { exercises, hasPlan, nextAppointment } = data.today;
  const plannedCount = exercises.reduce((sum, e) => sum + e.plannedToday, 0);
  const documentedCount = exercises.reduce((sum, e) => sum + e.documentedToday, 0);
  const completedCount = exercises.reduce((sum, e) => sum + e.completedToday, 0);
  const remaining = Math.max(0, plannedCount - documentedCount);
  const allDone = plannedCount > 0 && remaining === 0;
  const allCompleted = plannedCount > 0 && completedCount >= plannedCount;
  const firstName = fullName.split(" ")[0] || fullName;
  const orderedExercises = [...exercises].sort(
    (a, b) =>
      Number(a.fullyDocumentedToday) - Number(b.fullyDocumentedToday) ||
      a.sortOrder - b.sortOrder
  );

  return (
    <Screen
      bottomInset={TAB_BAR_CONTENT_HEIGHT}
      refreshing={state.refreshing}
      onRefresh={state.refresh}
    >
      <PageHeading>
        {t.greeting}
        {firstName ? `, ${firstName}` : ""}!
      </PageHeading>

      <SuccessCelebration
        loggedStatus={params.logged}
        allDocumented={allDone}
        allCompleted={allCompleted}
      />
      {params.painhint ? <Banner kind="warning">{t.painHint}</Banner> : null}

      {hasPlan && plannedCount > 0 ? (
        <Card>
          {allDone ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <SuccessCircle size={48} />
              <View style={{ flex: 1 }}>
                <Body bold size="lg">
                  {allCompleted ? t.allDoneTitle : t.allReportedTitle}
                </Body>
                <Body muted size="small">
                  {allCompleted ? t.allDoneBody : t.allReportedBody}
                </Body>
              </View>
            </View>
          ) : (
            <Body bold size="lg">
              {t.progressShort(documentedCount, plannedCount)}
            </Body>
          )}
          <ProgressBar
            value={documentedCount}
            max={plannedCount}
            label={t.progressBarLabel(documentedCount, plannedCount)}
          />
          {!allDone && data.reminders.showExerciseReminder ? (
            <Body muted size="small">
              {web.patient.reminders.dueBody(remaining)}
            </Body>
          ) : null}
          <AppButton
            label={
              allDone
                ? web.patient.session.viewSummary
                : documentedCount > 0
                  ? web.patient.session.resume
                  : web.patient.session.start
            }
            variant={allDone ? "outlinePrimary" : "primary"}
            onPress={() => router.push("/(tabs)/session")}
          />
        </Card>
      ) : null}

      {data.reminders.planUpdates.length > 0 ? (
        <Section heading={web.patient.reminders.planUpdatesHeading}>
          {data.reminders.planUpdates.map((notification) => (
            <Card key={notification.id}>
              <Body bold>{notification.title}</Body>
              <Body size="small">{notification.body}</Body>
              <TextLink
                label={web.patient.reminders.markRead}
                onPress={async () => {
                  await markNotificationRead(notification.id).catch(() => {});
                  state.refresh();
                }}
              />
            </Card>
          ))}
        </Section>
      ) : null}

      <Section heading={t.exercisesHeading}>
        {!hasPlan ? (
          <Card>
            <Body muted>{t.noPlanYet}</Body>
          </Card>
        ) : exercises.length === 0 ? (
          <Card>
            <Body muted>{t.noExercisesToday}</Body>
          </Card>
        ) : (
          orderedExercises.map((exercise) => (
            <Pressable
              key={exercise.planItemId}
              accessibilityRole="button"
              accessibilityLabel={t.openExercise(exercise.title)}
              onPress={() => router.push(`/(tabs)/exercise/${exercise.planItemId}`)}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <Card muted={exercise.fullyDocumentedToday}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}
                >
                  <ExerciseMark
                    documented={exercise.fullyDocumentedToday}
                    completed={exercise.fullyCompletedToday}
                    progressText={
                      exercise.plannedToday > 1
                        ? `${exercise.documentedToday}/${exercise.plannedToday}`
                        : undefined
                    }
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Body bold>{exercise.title}</Body>
                    {prescriptionSummary(exercise) ? (
                      <Body muted size="small">
                        {prescriptionSummary(exercise)}
                      </Body>
                    ) : null}
                    {exercise.fullyDocumentedToday ? (
                      <Body
                        bold
                        size="small"
                        color={exercise.fullyCompletedToday ? theme.success : theme.foreground}
                      >
                        {exercise.fullyCompletedToday ? t.doneBadge : t.documentedBadge}
                      </Body>
                    ) : progressLine(exercise) ? (
                      <Body bold size="small">
                        {progressLine(exercise)}
                      </Body>
                    ) : null}
                  </View>
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    size={24}
                    color={theme.mutedForeground}
                  />
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </Section>

      <Section heading={t.nextAppointment}>
        {nextAppointment ? (
          <AppointmentCard
            appointment={nextAppointment}
            onCancellationRequested={state.refresh}
          />
        ) : (
          <Card>
            <Body muted>{t.noAppointment}</Body>
          </Card>
        )}
      </Section>

      <Section heading={web.patient.authorization.title}>
        <Card>
          {data.authorization ? (
            <>
              <Body bold size="lg">
                {web.patient.authorization.remaining(
                  data.authorization.remaining,
                  data.authorization.adjustedTotal
                )}
              </Body>
              <Body bold size="small">{data.authorization.title}</Body>
              <Collapsible summary={web.patient.authorization.coverageHintTitle}>
                <Body muted size="small">
                  {web.patient.authorization.coverageHint}
                </Body>
              </Collapsible>
            </>
          ) : (
            <Body muted size="small">{web.patient.authorization.empty}</Body>
          )}
        </Card>
      </Section>
    </Screen>
  );
}
