import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { colors } from "@/config/branding";
import { de } from "@/messages/de";
import { SessionProvider } from "@/lib/session";

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  return (
    <SessionProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: de.auth.loginTitle }} />
        <Stack.Screen name="(auth)/invite-code" options={{ title: de.invite.title }} />
        <Stack.Screen name="(auth)/register" options={{ title: de.invite.registerTitle }} />
        <Stack.Screen
          name="(auth)/practice-blocked"
          options={{ title: de.common.appName, headerBackVisible: false }}
        />
        <Stack.Screen name="(auth)/forgot-password" options={{ title: de.auth.resetTitle }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="exercise/[planItemId]" options={{ title: de.common.appName }} />
        <Stack.Screen
          name="delete-account"
          options={{ title: de.profile.deleteAccount.title }}
        />
        <Stack.Screen name="auth/confirm" options={{ title: de.common.appName }} />
        <Stack.Screen name="reset-password" options={{ title: de.auth.newPasswordTitle }} />
        <Stack.Screen name="invite/[code]" options={{ headerShown: false }} />
      </Stack>
    </SessionProvider>
  );
}
