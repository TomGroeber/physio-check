import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Switch, View } from "react-native";
import {
  AppButton,
  Banner,
  Body,
  Card,
  Screen,
  Title,
  useTheme,
} from "@/components/ui";
import { spacing, touch } from "@/config/branding";
import { de } from "@/messages/de";
import { requestAccountDeletion } from "@/data/profile";
import { useSession } from "@/lib/session";

/**
 * Kontolöschung (Teil I6, D-062): klar erklärter, doppelt bestätigter
 * Löschantrag über den abgesicherten Serverpfad. Kein funktionsloser
 * Button, keine Sofortlöschung, keine erfundene Rechtssicherheit – die
 * Aufbewahrungsfrage für Praxisdaten in Luxemburg ist dokumentiert
 * offen (docs/APP_STORE_CHECKLIST.md).
 */
export default function DeleteAccount() {
  const router = useRouter();
  const theme = useTheme();
  const { signOut } = useSession();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    Alert.alert(
      de.profile.deleteAccount.doubleCheckTitle,
      de.profile.deleteAccount.doubleCheckBody,
      [
        { text: de.common.cancel, style: "cancel" },
        {
          text: de.profile.deleteAccount.submit,
          style: "destructive",
          onPress: async () => {
            setPending(true);
            setError(null);
            try {
              await requestAccountDeletion();
              Alert.alert(de.common.appName, de.profile.deleteAccount.done);
              await signOut();
              router.replace("/(auth)/welcome");
            } catch {
              setError(de.common.error);
            } finally {
              setPending(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Title>{de.profile.deleteAccount.title}</Title>
      <Card>
        <Body>{de.profile.deleteAccount.body}</Body>
      </Card>
      {error ? <Banner kind="error">{error}</Banner> : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: touch.minHeight,
          gap: spacing.md,
        }}
      >
        <Body>{de.profile.deleteAccount.confirmLabel}</Body>
        <Switch
          value={confirmed}
          onValueChange={setConfirmed}
          accessibilityLabel={de.profile.deleteAccount.confirmLabel}
          trackColor={{ true: theme.danger, false: theme.border }}
        />
      </View>
      <AppButton
        label={pending ? de.common.loading : de.profile.deleteAccount.submit}
        variant="danger"
        onPress={submit}
        disabled={!confirmed || pending}
      />
      <AppButton
        label={de.common.cancel}
        variant="secondary"
        onPress={() => router.back()}
      />
    </Screen>
  );
}
