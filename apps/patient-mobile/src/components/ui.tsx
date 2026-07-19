import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, touch, type, type ThemeColors } from "@/config/branding";
import { de } from "@/messages/de";

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? colors.dark : colors.light;
}

/** Scrollbarer Screen mit Pull-to-refresh und sicheren Rändern. */
export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{
        padding: spacing.md,
        paddingBottom: insets.bottom + spacing.xl,
        gap: spacing.md,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing ?? false}
            onRefresh={onRefresh}
            accessibilityLabel={de.common.pullToRefresh}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontSize: type.title,
        fontWeight: "700",
        color: theme.text,
      }}
    >
      {children}
    </Text>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{ fontSize: type.large, fontWeight: "700", color: theme.text }}
    >
      {children}
    </Text>
  );
}

export function Body({
  children,
  muted,
  center,
}: {
  children: ReactNode;
  muted?: boolean;
  center?: boolean;
}) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: type.base,
        lineHeight: type.base * 1.45,
        color: muted ? theme.mutedText : theme.text,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </Text>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 16,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      {children}
    </View>
  );
}

/** Große Hauptaktion: mindestens 56 pt hoch, voller Text (nie nur Icon). */
export function AppButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  hint,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  hint?: string;
}) {
  const theme = useTheme();
  const background =
    variant === "primary"
      ? theme.primary
      : variant === "danger"
        ? theme.dangerBg
        : theme.card;
  const color =
    variant === "primary"
      ? theme.primaryText
      : variant === "danger"
        ? theme.danger
        : theme.text;
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
        borderRadius: 14,
        backgroundColor: background,
        borderColor: variant === "secondary" ? theme.border : background,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: spacing.md,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <Text style={{ fontSize: type.base, fontWeight: "700", color }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Field({
  label,
  ...input
}: TextInputProps & { label: string }) {
  const theme = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={{ fontSize: type.small, fontWeight: "600", color: theme.text }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={theme.mutedText}
        {...input}
        style={{
          minHeight: touch.minHeight,
          borderWidth: 1,
          borderColor: theme.border,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          fontSize: type.base,
          color: theme.text,
          backgroundColor: theme.inputBg,
        }}
      />
    </View>
  );
}

export function Banner({
  kind,
  children,
}: {
  kind: "success" | "error" | "warning";
  children: ReactNode;
}) {
  const theme = useTheme();
  const palette =
    kind === "success"
      ? { bg: theme.successBg, fg: theme.success }
      : kind === "warning"
        ? { bg: theme.warningBg, fg: theme.warning }
        : { bg: theme.dangerBg, fg: theme.danger };
  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={{
        backgroundColor: palette.bg,
        borderRadius: 12,
        padding: spacing.md,
      }}
    >
      <Text style={{ fontSize: type.base, color: palette.fg, lineHeight: type.base * 1.4 }}>
        {children}
      </Text>
    </View>
  );
}

export function LoadingView() {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={de.common.loading}
      style={{ padding: spacing.xl, alignItems: "center", gap: spacing.md }}
    >
      <ActivityIndicator size="large" color={theme.primary} />
      <Body muted>{de.common.loading}</Body>
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
      <Body>{message ?? de.common.offlineBody}</Body>
      <AppButton label={de.common.retry} onPress={onRetry} variant="secondary" />
    </Card>
  );
}
