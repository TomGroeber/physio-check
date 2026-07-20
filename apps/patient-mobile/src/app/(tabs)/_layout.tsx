import { Redirect, Tabs } from "expo-router";
import { AppHeader } from "@/components/app-header";
import type { ComponentProps } from "react";
import { PatientTabBar } from "@/components/tab-bar";
import { web } from "@/messages/de";
import { useSession } from "@/lib/session";

/**
 * Patientenbereich wie das Web-Layout: Kopfzeile mit Marke + Avatar,
 * Inhalt, untere 3-Ziele-Navigation. `session` und `exercise/*` liegen
 * bewusst IN der Tab-Gruppe (Web: Navigation bleibt sichtbar, „Heute"
 * bleibt aktiv), sind aber keine eigenen Tabs.
 */
export default function TabsLayout() {
  const { initializing, session, isPracticeMember, link } = useSession();

  if (!initializing) {
    if (!session) return <Redirect href="/(auth)/welcome" />;
    if (isPracticeMember) return <Redirect href="/(auth)/practice-blocked" />;
    if (!link) return <Redirect href="/(auth)/invite-code" />;
  }

  return (
    <Tabs
      tabBar={(props) => (
        <PatientTabBar
          {...(props as unknown as ComponentProps<typeof PatientTabBar>)}
        />
      )}
      screenOptions={{ header: () => <AppHeader /> }}
    >
      <Tabs.Screen name="today" options={{ title: web.patient.nav.today }} />
      <Tabs.Screen
        name="appointments"
        options={{ title: web.patient.nav.appointments }}
      />
      <Tabs.Screen name="profile" options={{ title: web.patient.nav.profile }} />
      {/* Unterseiten des Heute-Bereichs – kein eigener Tab (href: null). */}
      <Tabs.Screen name="session" options={{ href: null, title: web.patient.session.title }} />
      <Tabs.Screen
        name="exercise/[planItemId]"
        options={{ href: null, title: web.patient.today.exercisesHeading }}
      />
    </Tabs>
  );
}
