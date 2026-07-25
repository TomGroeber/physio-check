import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { branding, maxContentWidth, spacing, touch, type } from "@/config/branding";
import { web } from "@/messages/de";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

/**
 * App-Kopfzeile wie das Web-Patientenlayout: Logo, PhysioCheck-Wortmarke
 * und rechts der Patientenavatar (Bild oder Initialen). Respektiert die
 * obere Safe Area (Dynamic Island/Statusleiste).
 */
export function AppHeader() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fullName, avatarUrl } = useSession();
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={{
        backgroundColor: theme.card,
        paddingTop: insets.top,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border,
      }}
    >
      <View
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: maxContentWidth,
          minHeight: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md - 4,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Image
          source={require("../../assets/images/logo.svg")}
          style={{ width: 32, height: 32, flexShrink: 0 }}
          contentFit="contain"
          accessible={false}
        />
        {/* Wortmarke ist Markenname, kein Inhalt: begrenzte Skalierung
            verhindert, dass sie bei größter Systemschrift Logo/Avatar
            aus der Kopfzeile drängt; Inhaltstexte skalieren überall
            uneingeschränkt (WCAG 2.2 AA). */}
        <Text
          style={{ fontSize: type.lg, fontWeight: "700", color: theme.foreground, flexShrink: 1 }}
          maxFontSizeMultiplier={1.5}
        >
          {branding.appName}
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          accessibilityRole="button"
          accessibilityLabel={web.patient.nav.profile}
          hitSlop={(touch.minHeight - 40) / 2}
          style={{ marginLeft: "auto", flexShrink: 0 }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              accessible={false}
            />
          ) : (
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: type.small, fontWeight: "700", color: theme.accentForeground }}>
                {initials || "?"}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}
