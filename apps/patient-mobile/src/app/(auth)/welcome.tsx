import { useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton, Body, Card, Title, useTheme } from "@/components/ui";
import { maxContentWidth, spacing } from "@/config/branding";
import { app } from "@/messages/de";

/** Startseite (Teil H): genau zwei große, klar erklärte Wege. */
export default function Welcome() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.lg,
      }}
    >
      <View
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: maxContentWidth,
          paddingHorizontal: spacing.lg,
          gap: spacing.lg,
        }}
      >
        <Title>{app.welcome.title}</Title>
        <Body muted>{app.welcome.subtitle}</Body>
        <Card>
          <AppButton
            label={app.welcome.withCode}
            hint={app.welcome.withCodeHint}
            onPress={() => router.push("/(auth)/invite-code")}
          />
          <Body muted size="small">{app.welcome.withCodeHint}</Body>
        </Card>
        <Card>
          <AppButton
            label={app.welcome.withAccount}
            hint={app.welcome.withAccountHint}
            variant="outline"
            onPress={() => router.push("/(auth)/login")}
          />
          <Body muted size="small">{app.welcome.withAccountHint}</Body>
        </Card>
      </View>
    </View>
  );
}
