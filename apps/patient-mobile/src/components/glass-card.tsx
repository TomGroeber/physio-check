import { BlurView } from "expo-blur";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing, type } from "@/config/branding";
import { useTheme, useThemeSetting } from "@/lib/theme";

/**
 * Natives Gegenstück zu `GlassPanel` der Website (Nachrichten-Screen,
 * s. DECISIONS.md): halbtransparente, weiche Fläche mit Blur, feiner
 * Lichtkante und Schatten. `expo-blur` (BlurView) übernimmt den
 * eigentlichen Weichzeichner-Effekt, ergänzt um denselben rgba-
 * Farbton wie die Website, damit die Fläche auch auf Android (wo der
 * native Blur schwächer/uneinheitlicher wirkt) konsistent lesbar
 * bleibt. Bewusst zurückhaltend (mittlere Blur-Intensität) - Text muss
 * immer gut lesbar bleiben.
 */
export function GlassCard({
  children,
  strong = false,
  style,
}: {
  children: React.ReactNode;
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const { theme: mode } = useThemeSetting();
  return (
    <View
      style={[
        {
          borderRadius: radius.glass,
          borderWidth: 1,
          borderColor: theme.glassBorder,
          shadowColor: theme.glassShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 20,
          elevation: 3,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <BlurView
        intensity={strong ? 55 : 40}
        tint={mode === "dark" ? "dark" : "light"}
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? theme.glassBgStrong : theme.glassBg },
        ]}
      />
      <View style={{ padding: spacing.md }}>{children}</View>
    </View>
  );
}

export function GlassCardTitle({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontSize: type.lg,
        fontWeight: "700",
        color: theme.foreground,
        marginBottom: spacing.sm,
      }}
    >
      {children}
    </Text>
  );
}
