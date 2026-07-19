import { useRouter } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton, Body, Card, Title, useTheme } from "@/components/ui";
import { spacing } from "@/config/branding";
import { de } from "@/messages/de";

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
        padding: spacing.lg,
        paddingTop: insets.top + spacing.xl,
        gap: spacing.lg,
      }}
    >
      <Title>{de.welcome.title}</Title>
      <Body muted>{de.welcome.subtitle}</Body>
      <Card>
        <AppButton
          label={de.welcome.withCode}
          hint={de.welcome.withCodeHint}
          onPress={() => router.push("/(auth)/invite-code")}
        />
        <Body muted>{de.welcome.withCodeHint}</Body>
      </Card>
      <Card>
        <AppButton
          label={de.welcome.withAccount}
          hint={de.welcome.withAccountHint}
          variant="secondary"
          onPress={() => router.push("/(auth)/login")}
        />
        <Body muted>{de.welcome.withAccountHint}</Body>
      </Card>
    </View>
  );
}
