import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { formatTimerSeconds } from "@physio-check/shared";
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
  useTheme,
} from "@/components/ui";
import { spacing, touch, type } from "@/config/branding";
import { de } from "@/messages/de";
import { getExerciseDetail, recordOccurrence, type LogInput } from "@/data/exercise";
import { useSession } from "@/lib/session";
import { useLoad } from "@/lib/use-load";

type Status = LogInput["status"];

function Chip({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.background,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
      }}
    >
      <Text style={{ fontSize: type.small, color: theme.text }}>{children}</Text>
    </View>
  );
}

function ScaleInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: type.small, fontWeight: "600", color: theme.text }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        {Array.from({ length: 11 }, (_, index) => (
          <Pressable
            key={index}
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${index}`}
            accessibilityState={{ selected: value === index }}
            onPress={() => onChange(value === index ? null : index)}
            style={{
              minWidth: touch.minHeight,
              minHeight: touch.minHeight,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: value === index ? theme.primary : theme.border,
              backgroundColor: value === index ? theme.primary : theme.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: type.base,
                fontWeight: "700",
                color: value === index ? theme.primaryText : theme.text,
              }}
            >
              {index}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function ExerciseVideo({ uri, poster }: { uri: string; poster: string | null }) {
  const { width } = useWindowDimensions();
  const player = useVideoPlayer(uri, (p) => {
    // Nie Autoplay mit Ton (Teil I2).
    p.pause();
  });
  return (
    <VideoView
      player={player}
      style={{
        width: width - spacing.md * 2,
        aspectRatio: 16 / 9,
        borderRadius: 12,
        backgroundColor: "#000",
      }}
      contentFit="contain"
      nativeControls
      {...(poster ? { posterSource: { uri: poster } } : {})}
    />
  );
}

/** Übung (Teil I2): großes Video, kompakte Vorgaben, Dokumentation. */
export default function ExerciseScreen() {
  const router = useRouter();
  const { planItemId } = useLocalSearchParams<{ planItemId: string }>();
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const { width } = useWindowDimensions();
  const state = useLoad(
    () => getExerciseDetail(userId, planItemId ?? ""),
    [userId, planItemId]
  );

  const [status, setStatus] = useState<Status | null>(null);
  const [setsCompleted, setSetsCompleted] = useState("");
  const [painBefore, setPainBefore] = useState<number | null>(null);
  const [painAfter, setPainAfter] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (state.loading && !state.data)
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  const exercise = state.data;
  if (!exercise)
    return (
      <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
        <ErrorView onRetry={state.reload} />
      </Screen>
    );

  const submit = async () => {
    if (!status) return;
    setPending(true);
    setError(null);
    try {
      await recordOccurrence({
        planItemId: exercise.planItemId,
        status,
        setsCompleted: setsCompleted ? Number(setsCompleted) : null,
        painBefore,
        painAfter,
        note: note.trim(),
      });
      setSaved(status);
      state.refresh();
    } catch {
      setError(de.common.error);
    } finally {
      setPending(false);
    }
  };

  const statusOptions: { value: Status; label: string }[] = [
    { value: "completed", label: de.exercise.statusCompleted },
    { value: "partial", label: de.exercise.statusPartial },
    { value: "too_difficult", label: de.exercise.statusTooDifficult },
    { value: "not_possible", label: de.exercise.statusNotPossible },
  ];

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
      <Title>{exercise.title}</Title>

      {exercise.media.video ? (
        <ExerciseVideo uri={exercise.media.video} poster={exercise.media.poster} />
      ) : exercise.media.alternate ? (
        <Image
          source={{ uri: exercise.media.alternate }}
          alt={exercise.title}
          accessibilityLabel={exercise.title}
          style={{
            width: width - spacing.md * 2,
            aspectRatio: 16 / 9,
            borderRadius: 12,
          }}
          resizeMode="cover"
        />
      ) : (
        <Card>
          <Body muted>{de.exercise.noMedia}</Body>
        </Card>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs }}>
        {exercise.sets ? <Chip>{de.exercise.dosageSets(exercise.sets)}</Chip> : null}
        {exercise.repetitions ? (
          <Chip>{de.exercise.dosageReps(exercise.repetitions)}</Chip>
        ) : null}
        {exercise.holdSeconds ? (
          <Chip>{de.exercise.dosageHold(exercise.holdSeconds)}</Chip>
        ) : null}
        {exercise.totalDurationSeconds ? (
          <Chip>{de.exercise.dosageDuration(exercise.totalDurationSeconds)}</Chip>
        ) : null}
        {exercise.restSeconds ? (
          <Chip>{de.exercise.dosageRest(exercise.restSeconds)}</Chip>
        ) : null}
        {exercise.equipment ? (
          <Chip>{de.exercise.equipment(exercise.equipment)}</Chip>
        ) : null}
      </View>

      {exercise.scheduleTimes.length > 0 ? (
        <Body muted>
          {de.exercise.times}: {exercise.scheduleTimes.join(", ")}
        </Body>
      ) : null}

      {exercise.note ? (
        <Card>
          <Subtitle>{de.exercise.practiceNote}</Subtitle>
          <Body>{exercise.note}</Body>
        </Card>
      ) : null}

      {saved ? (
        <>
          <Banner kind="success">
            {saved === "completed"
              ? de.exercise.loggedCompleted
              : de.exercise.loggedNeutral}
          </Banner>
          <AppButton
            label={de.exercise.backToToday}
            onPress={() => router.replace("/(tabs)/today")}
          />
        </>
      ) : !exercise.canDocument ? (
        <Card>
          <Body muted>{de.exercise.alreadyDone}</Body>
        </Card>
      ) : (
        <Card>
          <Subtitle>{de.exercise.logTitle}</Subtitle>
          {exercise.plannedToday > 1 ? (
            <Body muted>
              {de.today.occurrence(
                Math.min(exercise.documentedToday + 1, exercise.plannedToday),
                exercise.plannedToday
              )}
            </Body>
          ) : null}
          {error ? <Banner kind="error">{error}</Banner> : null}
          {statusOptions.map((option) => (
            <AppButton
              key={option.value}
              label={option.label}
              variant={status === option.value ? "primary" : "secondary"}
              onPress={() => setStatus(option.value)}
            />
          ))}
          {status ? (
            <>
              {exercise.sets ? (
                <Field
                  label={de.exercise.setsCompleted}
                  value={setsCompleted}
                  onChangeText={setSetsCompleted}
                  keyboardType="number-pad"
                />
              ) : null}
              <ScaleInput
                label={de.exercise.painBefore}
                value={painBefore}
                onChange={setPainBefore}
              />
              <ScaleInput
                label={de.exercise.painAfter}
                value={painAfter}
                onChange={setPainAfter}
              />
              <Field
                label={de.exercise.noteLabel}
                value={note}
                onChangeText={setNote}
                placeholder={de.exercise.notePlaceholder}
                multiline
              />
              <AppButton
                label={pending ? de.common.loading : de.exercise.submit}
                onPress={submit}
                disabled={pending}
              />
            </>
          ) : null}
        </Card>
      )}

      {exercise.totalDurationSeconds ? (
        <Body muted>
          {de.exercise.dosageDuration(exercise.totalDurationSeconds)} ·{" "}
          {formatTimerSeconds(exercise.totalDurationSeconds)}
        </Body>
      ) : null}
    </Screen>
  );
}
