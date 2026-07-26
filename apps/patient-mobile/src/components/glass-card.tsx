import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing } from "@/config/branding";
import { useTheme, useThemeSetting } from "@/lib/theme";

/**
 * Natives Gegenstück zu `GlassPanel` der Website: echtes Apple-
 * Liquid-Glass-Material über `@callstack/liquid-glass` (native
 * iOS-26-API, kein Shader-Nachbau). Auf nicht unterstützten Geräten
 * (Android, ältere iOS-Versionen) rendert die Bibliothek selbst einen
 * einfachen View ohne Effekt - dafür sorgt zusätzlich eine eigene
 * Fallback-Fläche (Farbe wie die Web-Glass-Tokens), damit die Karte
 * dort trotzdem als Fläche erkennbar bleibt statt unsichtbar zu sein.
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

  if (!isLiquidGlassSupported) {
    return (
      <View
        style={[
          {
            borderRadius: radius.glass,
            borderWidth: 1,
            borderColor: theme.glassBorder,
            backgroundColor: strong ? theme.glassBgStrong : theme.glassBg,
            padding: spacing.md,
            shadowColor: theme.glassShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 20,
            elevation: 3,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <LiquidGlassView
      effect={strong ? "regular" : "clear"}
      colorScheme={mode}
      tintColor={strong ? theme.glassBgStrong : undefined}
      style={[
        {
          borderRadius: radius.glass,
          overflow: "hidden",
          shadowColor: theme.glassShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 20,
        },
        style,
      ]}
    >
      <View style={{ padding: spacing.md }}>{children}</View>
    </LiquidGlassView>
  );
}
