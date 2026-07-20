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
import { app, web } from "@/messages/de";
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
      app.deleteAccount.doubleCheckTitle,
      app.deleteAccount.doubleCheckBody,
      [
        { text: web.common.cancel, style: "cancel" },
        {
          text: app.deleteAccount.submit,
          style: "destructive",
          onPress: async () => {
            setPending(true);
            setError(null);
            try {
              await requestAccountDeletion();
              Alert.alert(app.common.appName, app.deleteAccount.done);
              await signOut();
              router.replace("/(auth)/welcome");
            } catch {
              setError(web.common.error);
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
      <Title>{app.deleteAccount.title}</Title>
      <Card>
        <Body>{app.deleteAccount.body}</Body>
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
        <Body>{app.deleteAccount.confirmLabel}</Body>
        <Switch
          value={confirmed}
          onValueChange={setConfirmed}
          accessibilityLabel={app.deleteAccount.confirmLabel}
          trackColor={{ true: theme.destructive, false: theme.border }}
        />
      </View>
      <AppButton
        label={pending ? app.common.loading : app.deleteAccount.submit}
        variant="danger"
        onPress={submit}
        disabled={!confirmed || pending}
      />
      <AppButton
        label={web.common.cancel}
        variant="outline"
        onPress={() => router.back()}
      />
    </Screen>
  );
}
