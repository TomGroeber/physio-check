import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar03Icon,
  Home01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { maxContentWidth, radius, spacing, type } from "@/config/branding";
import { web } from "@/messages/de";
import { useTheme } from "@/lib/theme";

/** Sichtbare Mindesthöhe der Navigationsfläche (Web: min-h-18 = 72px). */
export const TAB_BAR_CONTENT_HEIGHT = 72;

const icons = {
  today: Home01Icon,
  appointments: Calendar03Icon,
  profile: UserCircleIcon,
} as const;

const labels: Record<string, string> = {
  today: web.patient.nav.today,
  appointments: web.patient.nav.appointments,
  profile: web.patient.nav.profile,
};

/**
 * Untere Hauptnavigation wie die Web-Referenz (bottom-nav.tsx): genau
 * drei gleich breite, beschriftete Ziele; aktives Ziel mit Akzent-Pille
 * um das Icon und fetter Schrift. Die Höhe entsteht aus Inhalt +
 * dynamischem Home-Indicator-Inset – KEINE feste Gesamthöhe (die feste
 * 64-pt-Höhe war die Ursache der abgeschnittenen Navigation).
 */
const visibleTabs = ["today", "appointments", "profile"] as const;

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
  // Unterseiten (session, exercise/*) zählen wie im Web zu „Heute“.
  const currentName = state.routes[state.index]?.name ?? "today";
  const activeName = visibleTabs.includes(currentName as (typeof visibleTabs)[number])
    ? currentName
    : "today";

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
