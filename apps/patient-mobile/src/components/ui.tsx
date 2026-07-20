import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  maxContentWidth,
  radius,
  spacing,
  touch,
  type,
  type ThemeColors,
} from "@/config/branding";
import { app } from "@/messages/de";
import { useTheme } from "@/lib/theme";

export { useTheme };

/**
 * Scrollbarer Screen wie das Web-Layout: max-w-lg zentriert, px-4/py-6,
 * Tastatur-sicher und mit dynamischem unteren Freiraum, damit Inhalte
 * nie hinter Tab-Bar oder Home-Indicator verschwinden.
 */
export function Screen({
  children,
  refreshing,
  onRefresh,
  bottomInset = 0,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Zusätzlicher Freiraum, z. B. Höhe der Tab-Bar. */
  bottomInset?: number;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          alignSelf: "center",
          width: "100%",
          maxWidth: maxContentWidth,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.lg,
          paddingBottom: Math.max(insets.bottom, spacing.md) + bottomInset + spacing.xl,
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing ?? false}
              onRefresh={onRefresh}
              accessibilityLabel={app.common.pullToRefresh}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Abschnitt mit Überschrift + Inhalt (Web: section > h2 + gap-3). */
export function Section({
  heading,
  children,
}: {
  heading?: string;
  children: ReactNode;
}) {
  return (
    <View style={{ gap: spacing.md - 4 }}>
      {heading ? <SectionHeading>{heading}</SectionHeading> : null}
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontSize: type.title, fontWeight: "700", color: theme.foreground }}
    >
      {children}
    </Text>
  );
}

/** Web h1 der Heute-Seite: text-2xl. */
export function PageHeading({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontSize: type.xl, fontWeight: "700", color: theme.foreground }}
    >
      {children}
    </Text>
  );
}

/** Web h2 der Abschnitte: text-xl bold. */
export function SectionHeading({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontSize: type.lg, fontWeight: "700", color: theme.foreground }}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
  bold,
  size = "base",
  color,
  center,
}: {
  children: ReactNode;
  muted?: boolean;
  bold?: boolean;
  size?: keyof typeof type;
  color?: string;
  center?: boolean;
}) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: type[size],
        lineHeight: type[size] * 1.45,
        fontWeight: bold ? "700" : "400",
        color: color ?? (muted ? theme.mutedForeground : theme.foreground),
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </Text>
  );
}

/** Karte wie shadcn Card: weiß, rounded-xl, feiner Rand, p-5. */
export function Card({
  children,
  muted,
  padded = true,
}: {
  children: ReactNode;
  muted?: boolean;
  padded?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: muted ? theme.muted : theme.card,
        borderColor: theme.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.lg,
        padding: padded ? spacing.md + 4 : 0,
        gap: spacing.md - 4,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

/**
 * Hauptaktion wie im Web (min-h-14, rounded-lg, text-lg bold):
 * primary = gefüllt Teal, outline = Rahmen, danger = destruktiv.
 */
export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  hint,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "outlinePrimary" | "danger";
  disabled?: boolean;
  hint?: string;
}) {
  const theme = useTheme();
  const styles: Record<string, { bg: string; fg: string; border: string; borderWidth: number }> = {
    primary: { bg: theme.primary, fg: theme.primaryForeground, border: theme.primary, borderWidth: 1 },
    outline: { bg: theme.card, fg: theme.foreground, border: theme.input, borderWidth: 1 },
    outlinePrimary: { bg: "transparent", fg: theme.primary, border: theme.primary, borderWidth: 2 },
    danger: { bg: "transparent", fg: theme.destructive, border: theme.destructive, borderWidth: 1 },
  };
  const s = styles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: disabled ?? false }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: touch.actionHeight,
        borderRadius: radius.md,
        backgroundColor: s.bg,
        borderColor: s.border,
        borderWidth: s.borderWidth,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.md + 4,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontSize: type.base, fontWeight: "700", color: s.fg, textAlign: "center" }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...input
}: TextInputProps & { label: string; hint?: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: spacing.xs + 2 }}>
      <Text style={{ fontSize: type.small, fontWeight: "600", color: theme.foreground }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.mutedForeground}
        {...input}
        style={{
          minHeight: touch.minHeight,
          borderWidth: 1,
          borderColor: theme.input,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md - 4,
          paddingVertical: input.multiline ? spacing.sm : 0,
          fontSize: type.base,
          color: theme.foreground,
          backgroundColor: theme.card,
          textAlignVertical: input.multiline ? "top" : "center",
        }}
      />
      {hint ? <Body muted size="small">{hint}</Body> : null}
    </View>
  );
}

/**
 * Statusfläche wie im Web: Erfolg = rounded-xl border-success/40
 * bg-success/10; Warnung analog; Fehler destruktiv. Live-Region.
 */
export function Banner({
  kind,
  title,
  children,
  icon,
}: {
  kind: "success" | "error" | "warning";
  title?: string;
  children?: ReactNode;
  icon?: boolean;
}) {
  const theme = useTheme();
  const palette =
    kind === "success"
      ? { bg: theme.successSoft, border: theme.success, fg: theme.foreground }
      : kind === "warning"
        ? { bg: theme.warningSoft, border: theme.warning, fg: theme.foreground }
        : { bg: theme.card, border: theme.destructive, fg: theme.destructive };
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md,
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.md + 4,
      }}
    >
      {icon ? <SuccessCircle size={56} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <Text style={{ fontSize: type.lg, fontWeight: "700", color: palette.fg }}>
            {title}
          </Text>
        ) : null}
        {typeof children === "string" ? (
          <Text style={{ fontSize: type.small, lineHeight: type.small * 1.45, color: palette.fg }}>
            {children}
          </Text>
        ) : (
          children ?? null
        )}
      </View>
    </View>
  );
}

/** Grüner Kreis mit Haken (Web: bg-success + Tick). */
export function SuccessCircle({ size = 48 }: { size?: number }) {
  const theme = useTheme();
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.success,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <HugeiconsIcon
        icon={Tick02Icon}
        size={size * 0.55}
        color={theme.successForeground}
        strokeWidth={2.5}
      />
    </View>
  );
}

/**
 * Checklisten-Kreis der Heute-Liste: Haken (grün = erledigt, Warnrahmen
 * = dokumentiert, nicht vollständig), sonst Stand oder leerer Kreis.
 */
export function ExerciseMark({
  documented,
  completed,
  progressText,
}: {
  documented: boolean;
  completed: boolean;
  progressText?: string;
}) {
  const theme = useTheme();
  if (documented) {
    return (
      <View
        accessibilityElementsHidden
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: completed ? theme.success : theme.warningSoft,
          borderWidth: completed ? 0 : 2,
          borderColor: theme.warning,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HugeiconsIcon
          icon={Tick02Icon}
          size={26}
          color={completed ? theme.successForeground : theme.foreground}
          strokeWidth={2.5}
        />
      </View>
    );
  }
  return (
    <View
      accessibilityElementsHidden
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: theme.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {progressText ? (
        <Text style={{ fontSize: type.small, fontWeight: "700", color: theme.foreground }}>
          {progressText}
        </Text>
      ) : null}
    </View>
  );
}

/** Fortschrittsbalken wie im Web (h-3, rounded-full, success). */
export function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const theme = useTheme();
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
      style={{
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.muted,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${percent}%`,
          height: "100%",
          borderRadius: 6,
          backgroundColor: theme.success,
        }}
      />
    </View>
  );
}

/** Vorgaben-Chip wie im Web: Pille mit Rand auf Kartenfläche. */
export function Chip({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        minHeight: touch.minHeight,
        justifyContent: "center",
        borderRadius: radius.full,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.card,
        paddingHorizontal: spacing.md + 4,
      }}
    >
      <Text style={{ fontSize: type.base, fontWeight: "600", color: theme.foreground }}>
        {children}
      </Text>
    </View>
  );
}

/** Einklappbarer Bereich wie <details> im Web (Titel in Primärfarbe). */
export function Collapsible({
  summary,
  children,
  initiallyOpen = false,
}: {
  summary: string;
  children: ReactNode;
  initiallyOpen?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: radius.lg,
        backgroundColor: theme.card,
        overflow: "hidden",
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={summary}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={{
          minHeight: touch.actionHeight,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: spacing.md,
          gap: spacing.sm,
        }}
      >
        <Text style={{ flex: 1, fontSize: type.base, fontWeight: "700", color: theme.primary }}>
          {summary}
        </Text>
        <HugeiconsIcon
          icon={open ? ArrowUp01Icon : ArrowDown01Icon}
          size={22}
          color={theme.primary}
        />
      </Pressable>
      {open ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.border,
            padding: spacing.md,
            gap: spacing.md,
          }}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Auswahlzeile wie die Web-Radio-Labels (border, primary bei Auswahl).
 * Zustand wird nie nur über Farbe vermittelt: Punkt + fette Schrift.
 */
export function RadioRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={{
        minHeight: touch.minHeight + 4,
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md - 4,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? theme.primary : theme.input,
        backgroundColor: selected ? theme.primarySoft : theme.card,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
      }}
    >
      <View
        accessibilityElementsHidden
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: selected ? theme.primary : theme.mutedForeground,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? (
          <View
            style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: theme.primary }}
          />
        ) : null}
      </View>
      <Text
        style={{
          flex: 1,
          fontSize: type.base,
          fontWeight: selected ? "700" : "400",
          color: theme.foreground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Text-Link-Zeile wie „Zurück zu Heute“ (Primärfarbe, min-h-12). */
export function TextLink({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: TextStyle;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{ minHeight: touch.minHeight, justifyContent: "center", alignSelf: "flex-start" }}
    >
      <Text
        style={{ fontSize: type.base, fontWeight: "600", color: theme.primary, ...style }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function LoadingView() {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={app.common.loading}
      style={{ padding: spacing.xl, alignItems: "center", gap: spacing.md }}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      <Body muted>{app.common.loading}</Body>
    </View>
  );
}

export function ErrorView({
  message,
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <Card>
      <Body>{message ?? app.common.offlineBody}</Body>
      <AppButton label={app.common.retry} onPress={onRetry} variant="outline" />
    </Card>
  );
}

export type { ThemeColors };
