import { Redirect, Tabs } from "expo-router";
import { Text, useColorScheme } from "react-native";
import { colors, type } from "@/config/branding";
import { de } from "@/messages/de";
import { useSession } from "@/lib/session";

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  return (
    <Text
      style={{
        fontSize: type.small,
        fontWeight: focused ? "700" : "500",
        color: focused ? theme.primary : theme.mutedText,
      }}
    >
      {label}
    </Text>
  );
}

/**
 * Maximal drei Bereiche (Regel 9): Heute, Termine, Profil.
 * Textbeschriftungen statt reiner Icons – kritische Navigation ist nie
 * icon-only (Teil K).
 */
export default function TabsLayout() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? colors.dark : colors.light;
  const { initializing, session, isPracticeMember, link } = useSession();

  if (!initializing) {
    if (!session) return <Redirect href="/(auth)/welcome" />;
    if (isPracticeMember) return <Redirect href="/(auth)/practice-blocked" />;
    if (!link) return <Redirect href="/(auth)/invite-code" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedText,
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: de.tabs.today,
          tabBarLabel: ({ focused }) => (
            <TabLabel label={de.tabs.today} focused={focused} />
          ),
          tabBarIcon: () => null,
          tabBarAccessibilityLabel: de.tabs.today,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: de.tabs.appointments,
          tabBarLabel: ({ focused }) => (
            <TabLabel label={de.tabs.appointments} focused={focused} />
          ),
          tabBarIcon: () => null,
          tabBarAccessibilityLabel: de.tabs.appointments,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: de.tabs.profile,
          tabBarLabel: ({ focused }) => (
            <TabLabel label={de.tabs.profile} focused={focused} />
          ),
          tabBarIcon: () => null,
          tabBarAccessibilityLabel: de.tabs.profile,
        }}
      />
    </Tabs>
  );
}
