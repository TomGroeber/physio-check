import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  completionStatusValues,
  shouldShowPainHint,
} from "@physio-check/shared";
import {
  AppButton,
  Body,
  Collapsible,
  Field,
  RadioRow,
  useTheme,
} from "@/components/ui";
import { radius, spacing, touch, type } from "@/config/branding";
import { web } from "@/messages/de";
import { recordOccurrence } from "@/data/exercise";

const t = web.patient.exercise;

type Status = (typeof completionStatusValues)[number];

/**
 * Schmerzskala 0–10 wie das Web-Auswahlfeld, nativ als große
 * Tippflächen (0 = kein Schmerz, 10 = stärkster Schmerz); erneutes
 * Tippen entfernt die Angabe („Keine Angabe“).
 */
function PainScale({
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
    <View style={{ gap: spacing.xs + 2 }}>
      <Text style={{ fontSize: type.small, fontWeight: "600", color: theme.foreground }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.xs + 2 }}>
        {Array.from({ length: 11 }, (_, index) => {
          const selected = value === index;
          return (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityLabel={`${label}: ${index}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? null : index)}
              style={{
                minWidth: touch.minHeight,
                minHeight: touch.minHeight,
                borderRadius: radius.md,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? theme.primary : theme.input,
                backgroundColor: selected ? theme.primarySoft : theme.card,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: type.base,
                  fontWeight: selected ? "700" : "400",
                  color: theme.foreground,
                }}
              >
                {index}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Dokumentationsformular wie exercise-log-form.tsx der Website:
 * Durchgangs-Hinweis, vier Status als Auswahlzeilen (Standard
 * „Erledigt“), einklappbare optionale Angaben, Selbstauskunfts-Hinweis.
 */
export function ExerciseLogForm({
  planItemId,
  maxSets,
  occurrenceIndex,
  plannedOccurrences,
  mode = "detail",
  onSaved,
}: {
  planItemId: string;
  maxSets: number | null;
  occurrenceIndex: number;
  plannedOccurrences: number;
  mode?: "detail" | "guided";
  onSaved: (result: { status: Status; painHint: boolean }) => void;
}) {
  const theme = useTheme();
  const [status, setStatus] = useState<Status>("completed");
  const [setsCompleted, setSetsCompleted] = useState("");
  const [painBefore, setPainBefore] = useState<number | null>(null);
  const [painAfter, setPainAfter] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setPending(true);
    setError(null);
    try {
      const sets = setsCompleted ? Number(setsCompleted) : null;
      await recordOccurrence({
        planItemId,
        status,
        setsCompleted:
          sets !== null && Number.isFinite(sets)
            ? Math.max(0, Math.min(sets, maxSets ?? 20))
            : null,
        painBefore,
        painAfter,
        note: note.trim(),
      });
      onSaved({
        status,
        painHint: shouldShowPainHint({
          painBefore: painBefore ?? undefined,
          painAfter: painAfter ?? undefined,
        }),
      });
    } catch {
      setError(web.common.error);
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={{ gap: spacing.md + 4 }}>
      {error ? <Body color={theme.destructive}>{error}</Body> : null}
      <View
        accessibilityRole="text"
        style={{
          backgroundColor: theme.primarySoft,
          borderRadius: radius.md,
          padding: spacing.md,
        }}
      >
        <Body bold size="lg">
          {t.occurrenceHeading(occurrenceIndex, plannedOccurrences)}
        </Body>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel={t.statusLabel} style={{ gap: spacing.sm }}>
        <Body bold size="small">{t.statusLabel}</Body>
        {completionStatusValues.map((value) => (
          <RadioRow
            key={value}
            label={t.status[value]}
            selected={status === value}
            onPress={() => setStatus(value)}
          />
        ))}
      </View>
      <Collapsible summary={t.optionalToggle}>
        <Field
          label={t.setsCompletedLabel}
          value={setsCompleted}
          onChangeText={setSetsCompleted}
          keyboardType="number-pad"
        />
        <PainScale label={t.painBeforeLabel} value={painBefore} onChange={setPainBefore} />
        <PainScale label={t.painAfterLabel} value={painAfter} onChange={setPainAfter} />
        <Body muted size="small">{t.painScaleHint}</Body>
        <Field
          label={t.noteLabel}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          maxLength={1000}
        />
      </Collapsible>
      <Body muted size="small">{t.selfReportHint}</Body>
      <AppButton
        label={
          pending
            ? web.common.loading
            : mode === "guided"
              ? web.patient.session.saveAndContinue
              : t.submit
        }
        onPress={submit}
        disabled={pending}
      />
    </View>
  );
}
