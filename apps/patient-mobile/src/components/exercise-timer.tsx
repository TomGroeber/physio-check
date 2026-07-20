import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { formatTimerSeconds } from "@physio-check/shared";
import { AppButton, Body, Card, useTheme } from "@/components/ui";
import { spacing, type } from "@/config/branding";
import { web } from "@/messages/de";

const t = web.patient.session.timer;

/**
 * Optionaler Timer wie exercise-timer.tsx der Website: Start/Pause/
 * Zurücksetzen, dokumentiert nie automatisch.
 */
export function ExerciseTimer({ durationSeconds }: { durationSeconds: number }) {
  const theme = useTheme();
  const [remaining, setRemaining] = useState(durationSeconds);
  const [running, setRunning] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          setRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [running]);

  return (
    <Card>
      <Body bold size="lg">{t.heading}</Body>
      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${t.heading}: ${formatTimerSeconds(remaining)}`}
        style={{
          fontSize: type.title + 10,
          fontWeight: "700",
          color: remaining === 0 ? theme.success : theme.foreground,
          textAlign: "center",
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatTimerSeconds(remaining)}
      </Text>
      {remaining === 0 ? <Body center>{t.finished}</Body> : null}
      <View style={{ flexDirection: "row", gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppButton
            label={running ? t.pause : t.start}
            variant={running ? "outline" : "primary"}
            onPress={() => setRunning((value) => !value && remaining > 0)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <AppButton
            label={t.reset}
            variant="outline"
            onPress={() => {
              setRunning(false);
              setRemaining(durationSeconds);
            }}
          />
        </View>
      </View>
      <Body muted size="small">{t.hint}</Body>
    </Card>
  );
}
