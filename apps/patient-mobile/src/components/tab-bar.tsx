import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar03Icon,
  Home01Icon,
  Message01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { maxContentWidth, radius, spacing, type } from "@/config/branding";
import { hasUnreadReply } from "@/data/messages";
import { web } from "@/messages/de";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme";

/** Sichtbare Mindesthöhe der Navigationsfläche (Web: min-h-18 = 72px). */
export const TAB_BAR_CONTENT_HEIGHT = 72;

const icons = {
  today: Home01Icon,
  appointments: Calendar03Icon,
  messages: Message01Icon,
  profile: UserCircleIcon,
} as const;

const labels: Record<string, string> = {
  today: web.patient.nav.today,
  appointments: web.patient.nav.appointments,
  messages: web.patient.nav.messages,
  profile: web.patient.nav.profile,
};

/**
 * Untere Hauptnavigation wie die Web-Referenz (bottom-nav.tsx): vier
 * gleich breite, beschriftete Ziele; aktives Ziel mit Akzent-Pille
 * um das Icon und fetter Schrift. Die Höhe entsteht aus Inhalt +
 * dynamischem Home-Indicator-Inset – KEINE feste Gesamthöhe (die feste
 * 64-pt-Höhe war die Ursache der abgeschnittenen Navigation).
 */
const visibleTabs = ["today", "appointments", "messages", "profile"] as const;

/** Minimale Props der React-Navigation-TabBar (keine direkte Abhängigkeit). */
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation: {
    emit: (event: { type: string; target?: string; canPreventDefault?: boolean }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string) => void;
  };
};

export function PatientTabBar({ state, navigation }: TabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { link } = useSession();
  const practiceId = link?.practiceId ?? "";
  const [unread, setUnread] = useState(false);
  // Unterseiten (session, exercise/*) zählen wie im Web zu „Heute“.
  const currentName = state.routes[state.index]?.name ?? "today";
  const activeName = visibleTabs.includes(currentName as (typeof visibleTabs)[number])
    ? currentName
    : "today";

  useEffect(() => {
    if (!practiceId) return;
    let cancelled = false;
    const check = () => {
      hasUnreadReply(practiceId).then((value) => {
        if (!cancelled) setUnread(value);
      });
    };
    check();
    const subscription = AppState.addEventListener("change", (appState) => {
      if (appState === "active") check();
    });
    // Aktualisiert sich außerdem beim Wechsel des aktiven Tabs (z. B.
    // nach dem Verlassen von "Nachrichten", wo als gelesen markiert wird).
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [practiceId, activeName]);

  return (
    <View
      accessibilityRole="tablist"
      style={{
        backgroundColor: theme.card,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: maxContentWidth,
          flexDirection: "row",
        }}
      >
        {state.routes
          .filter((route) =>
            visibleTabs.includes(route.name as (typeof visibleTabs)[number])
          )
          .map((route) => {
          const active = route.name === activeName;
          const label = labels[route.name] ?? route.name;
          const icon = icons[route.name as keyof typeof icons] ?? Home01Icon;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!active && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              }}
              style={{
                flex: 1,
                minHeight: TAB_BAR_CONTENT_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.xs,
                paddingVertical: spacing.sm,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 32,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? theme.accent : "transparent",
                }}
              >
                <HugeiconsIcon
                  icon={icon}
                  size={26}
                  strokeWidth={2}
                  color={active ? theme.accentForeground : theme.mutedForeground}
                />
                {route.name === "messages" && unread && (
                  <View
                    accessibilityLabel={`${label} – ungelesen`}
                    style={{
                      position: "absolute",
                      top: 2,
                      right: 10,
                      width: 10,
                      height: 10,
                      borderRadius: radius.full,
                      backgroundColor: theme.destructive,
                    }}
                  />
                )}
              </View>
              <Text
                style={{
                  fontSize: type.small,
                  fontWeight: active ? "700" : "400",
                  color: active ? theme.accentForeground : theme.mutedForeground,
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
          })}
      </View>
    </View>
  );
}
