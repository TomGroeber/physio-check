import { Stack } from "expo-router";
import { app } from "@/messages/de";
import { SessionProvider } from "@/lib/session";
import { ThemeProvider, useTheme } from "@/lib/theme";

function ThemedStack() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.foreground,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/welcome" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ title: app.auth.loginTitle }} />
      <Stack.Screen name="(auth)/invite-code" options={{ title: "" }} />
      <Stack.Screen name="(auth)/register" options={{ title: "" }} />
      <Stack.Screen
        name="(auth)/practice-blocked"
        options={{ title: app.common.appName, headerBackVisible: false }}
      />
      <Stack.Screen name="(auth)/forgot-password" options={{ title: app.auth.resetTitle }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="delete-account" options={{ title: app.deleteAccount.title }} />
      <Stack.Screen name="auth/confirm" options={{ title: app.common.appName }} />
      <Stack.Screen name="reset-password" options={{ title: app.auth.newPasswordTitle }} />
      <Stack.Screen name="invite/[code]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <ThemedStack />
      </SessionProvider>
    </ThemeProvider>
  );
}
