import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { branding, maxContentWidth, spacing, type } from "@/config/branding";
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
          height: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md - 4,
          paddingHorizontal: spacing.md,
        }}
      >
        <Image
          source={require("../../assets/images/logo.svg")}
          style={{ width: 32, height: 32 }}
          contentFit="contain"
          accessible={false}
        />
        <Text style={{ fontSize: type.lg, fontWeight: "700", color: theme.foreground }}>
          {branding.appName}
        </Text>
        <View style={{ marginLeft: "auto" }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              accessibilityLabel={web.common.avatarAlt(fullName)}
            />
          ) : (
            <View
              accessible
              accessibilityLabel={web.common.avatarAlt(fullName)}
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
        </View>
      </View>
    </View>
  );
}
