import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useWindowDimensions, View } from "react-native";
import { Body, Chip, useTheme } from "@/components/ui";
import { maxContentWidth, radius, spacing } from "@/config/branding";
import { web } from "@/messages/de";
import type { ExerciseDetail } from "@/data/exercise";
import { prescriptionChips, scheduleText } from "@/lib/format";

const t = web.patient.exercise;

function ExerciseVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    // Nie Autoplay mit Ton – Start nur auf Wunsch (wie Web).
    instance.pause();
  });
  return (
    <VideoView
      player={player}
      style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" }}
      contentFit="contain"
      nativeControls
    />
  );
}

/**
 * Video-first-Übungsansicht wie exercise-view.tsx der Website: großes
 * 16:9-Medium (auf schmalen Screens randlos), darunter die ruhige
 * Vorgabenfläche mit Chips, Häufigkeit, Uhrzeiten und Praxisnotiz.
 */
export function ExerciseView({ detail }: { detail: ExerciseDetail }) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const chips = prescriptionChips(detail);
  // Randlos wie im Web (-mx-4), solange der Screen schmaler als max-w-lg ist.
  const fullBleed = width < maxContentWidth;
  const bleedStyle = fullBleed
    ? { marginHorizontal: -spacing.md }
    : { borderRadius: radius.xl, overflow: "hidden" as const };

  return (
    <View style={{ gap: spacing.lg - 4 }}>
      <View accessibilityLabel={t.videoHeading} style={bleedStyle}>
        {detail.media.video ? (
          <ExerciseVideo uri={detail.media.video} />
        ) : detail.media.alternate ? (
          <Image
            source={{ uri: detail.media.alternate }}
            alt={t.fallbackImageAlt(detail.title)}
            accessibilityLabel={t.fallbackImageAlt(detail.title)}
            style={{ width: "100%", aspectRatio: 16 / 9, backgroundColor: theme.muted }}
            contentFit="contain"
          />
        ) : (
          <View
            style={{
              width: "100%",
              aspectRatio: 16 / 9,
              backgroundColor: theme.muted,
              alignItems: "center",
              justifyContent: "center",
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
            }}
          >
            <Body bold center>{t.noVideo}</Body>
            <Body muted size="small" center>
              {t.noVideoBody}
            </Body>
          </View>
        )}
      </View>

      <View
        accessibilityLabel={t.prescriptionHeading}
        style={{
          backgroundColor: theme.muted,
          borderRadius: radius.xl,
          padding: spacing.md + 4,
          gap: spacing.md,
        }}
      >
        {chips.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {chips.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </View>
        ) : null}
        <Body>{scheduleText(detail.schedule)}</Body>
        {detail.scheduleTimes.length > 0 ? (
          <Body>
            {t.preferredTimes(
              detail.scheduleTimes
                .map((time) => `${time} ${web.units.timeSuffix}`)
                .join(", ")
            )}
          </Body>
        ) : null}
        {detail.note ? (
          <View
            style={{
              backgroundColor: theme.primarySoft,
              borderRadius: radius.lg,
              padding: spacing.md,
              gap: 2,
            }}
          >
            <Body bold size="small">{t.planNote}</Body>
            <Body>{detail.note}</Body>
          </View>
        ) : null}
      </View>
    </View>
  );
}
