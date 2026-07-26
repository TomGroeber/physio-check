import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar03Icon,
  Home01Icon,
  Message01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  AppState,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { maxContentWidth, radius, spacing, type } from "@/config/branding";
import { hasUnreadReply } from "@/data/messages";
import { web } from "@/messages/de";
import { useReduceMotion } from "@/lib/accessibility-preferences";
import { useSession } from "@/lib/session";
import { useTheme, useThemeSetting } from "@/lib/theme";
import { LiquidLens } from "./liquid-lens";

/** Sichtbare Mindesthöhe der Navigationsfläche (Touch-Ziel ≥ 48 px). */
export const TAB_BAR_CONTENT_HEIGHT = 64;

/** Größe/Position der schwebenden Hervorhebung hinter dem aktiven Icon. */
const HIGHLIGHT_WIDTH = 52;
const HIGHLIGHT_HEIGHT = 40;
const HIGHLIGHT_TOP = 6;

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
 * gleich breite, beschriftete Ziele. Eine einzelne, durchgehend
 * animierte Glas-Hervorhebung gleitet zwischen den Icons – beim
 * Antippen sanft (Spring), beim Ziehen über die Leiste (ohne
 * loszulassen) direkt unter dem Finger, wie bei Apples eigener
 * iOS-26-Tab-Bar. Echtes Apple-Liquid-Glass-Material
 * (`@callstack/liquid-glass`, iOS 26+); auf anderen Plattformen/
 * Systemversionen bleibt es eine deckende Fläche ohne Animation der
 * Hervorhebungsfarbe.
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
  const { theme: mode } = useThemeSetting();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { link } = useSession();
  const practiceId = link?.practiceId ?? "";
  const [unread, setUnread] = useState(false);
  // Unterseiten (session, exercise/*) zählen wie im Web zu „Heute“.
  const currentName = state.routes[state.index]?.name ?? "today";
  const activeName = visibleTabs.includes(currentName as (typeof visibleTabs)[number])
    ? currentName
    : "today";

  const filteredRoutes = state.routes.filter((route) =>
    visibleTabs.includes(route.name as (typeof visibleTabs)[number])
  );
  const activeIndex = filteredRoutes.findIndex((route) => route.name === activeName);

  const navigateToRoute = (route: { key: string; name: string }) => {
    if (route.name === activeName) return;
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  // Waagerechte Verschiebung der Hervorhebung (0 = unter dem ersten
  // Ziel). `useRef(new Animated.Value(...)).current` ist Reacts eigenes,
  // offizielles Muster für so ein dauerhaftes, animiertes Objekt (s.
  // React-Native-Doku zu `Animated`) – der Wert selbst ändert sich nie
  // während des Renderns, nur über `.setValue()`/`Animated.spring()`
  // außerhalb davon.
  // eslint-disable-next-line react-hooks/refs
  const highlightX = useRef(new Animated.Value(0)).current;
  const rowWidthRef = useRef(0);
  const draggingRef = useRef(false);
  const lastDragIndexRef = useRef<number | null>(null);

  // Linke Kante der Hervorhebung, damit ihre Mitte exakt auf der Mitte
  // von Ziel `index` liegt (Basis-`left` ist 0, es wird nur über
  // `transform: translateX` verschoben).
  const highlightLeftForIndex = (index: number) => {
    const itemWidth = rowWidthRef.current / (filteredRoutes.length || 1);
    return index * itemWidth + itemWidth / 2 - HIGHLIGHT_WIDTH / 2;
  };

  const settleTo = (index: number) => {
    const toValue = highlightLeftForIndex(index);
    if (reduceMotion) {
      highlightX.setValue(toValue);
      return;
    }
    Animated.spring(highlightX, {
      toValue,
      useNativeDriver: true,
      damping: 20,
      stiffness: 220,
      mass: 0.8,
    }).start();
  };

  useEffect(() => {
    if (draggingRef.current) return;
    if (activeIndex < 0) return;
    settleTo(activeIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeName]);

  const handleDragX = (x: number) => {
    const width = rowWidthRef.current;
    const count = filteredRoutes.length;
    if (!width || count === 0) return;
    // Die Hervorhebung folgt direkt dem Finger (wie ein Tropfen), nicht
    // erst nach dem Erreichen einer Ziel-Mitte.
    const half = HIGHLIGHT_WIDTH / 2;
    const center = Math.min(width - half, Math.max(half, x));
    highlightX.setValue(center - half);

    const index = Math.min(count - 1, Math.max(0, Math.floor((x / width) * count)));
    if (lastDragIndexRef.current === index) return;
    lastDragIndexRef.current = index;
    const route = filteredRoutes[index];
    if (route) navigateToRoute(route);
  };

  // Wie bei Apple: Auf einem Ziel andrücken und ohne loszulassen zu
  // einem anderen gleiten wechselt live den Tab. Die Capture-Variante
  // entscheidet VOR den <Pressable>-Kindern, ob eine echte waagerechte
  // Ziehbewegung vorliegt – mit der Bubble-Variante (onMoveShouldSet...
  // ohne Capture) beanspruchte das schon aktive <Pressable> die Geste
  // zuerst, wodurch das Gleiten nie ausgelöst wurde.
  //
  // Bewusst OHNE useRef/useMemo: PanResponder.create() ist billig, eine
  // neu erzeugte Instanz pro Render vermeidet veraltete Closures
  // (activeName/filteredRoutes vom ersten Render). React Natives
  // eigenes offizielles Muster für PanResponder liest dabei zwangsläufig
  // Refs innerhalb der Callback-Objekte – die neue react-hooks/refs-
  // Regel erkennt das fälschlich als Render-Zugriff, obwohl die Refs
  // erst beim tatsächlichen Touch-Event gelesen werden, nie synchron
  // während dieses Renders.
  // eslint-disable-next-line react-hooks/refs
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponderCapture: (_evt, gestureState) => Math.abs(gestureState.dx) > 6,
    onPanResponderGrant: (evt) => {
      draggingRef.current = true;
      handleDragX(evt.nativeEvent.locationX);
    },
    onPanResponderMove: (evt) => handleDragX(evt.nativeEvent.locationX),
    onPanResponderRelease: () => {
      draggingRef.current = false;
      lastDragIndexRef.current = null;
      if (activeIndex >= 0) settleTo(activeIndex);
    },
    onPanResponderTerminate: () => {
      draggingRef.current = false;
      lastDragIndexRef.current = null;
      if (activeIndex >= 0) settleTo(activeIndex);
    },
  });

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

  // Schwebende Kapsel wie Apples eigene iOS-26-Tab-Bar: rundum vom
  // Bildschirmrand abgesetzt (nicht randlos), volle Kapselform, Tiefe
  // über Schatten statt Trennlinie. Inhalte scrollen darunter hindurch
  // und machen den Glaseffekt sichtbar. Die Screens reservieren dafür
  // bereits über `Screen`'s bottomInset={TAB_BAR_CONTENT_HEIGHT} Platz.
  const barBorderStyle = {
    position: "absolute" as const,
    left: spacing.md,
    right: spacing.md,
    bottom: Math.max(insets.bottom, spacing.md) + spacing.xs,
    borderRadius: radius.full,
    overflow: "hidden" as const,
    shadowColor: theme.glassShadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  };

  const highlight = (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: HIGHLIGHT_TOP,
        left: 0,
        transform: [{ translateX: highlightX }],
      }}
    >
      <LiquidLens
        width={HIGHLIGHT_WIDTH}
        height={HIGHLIGHT_HEIGHT}
        colorScheme={mode}
        interactive
        shimmerTrigger={activeName}
      />
    </Animated.View>
  );

  const items = (
    <View
      onLayout={(e) => {
        rowWidthRef.current = e.nativeEvent.layout.width;
        if (activeIndex >= 0) {
          highlightX.setValue(highlightLeftForIndex(activeIndex));
        }
      }}
      style={{
        alignSelf: "center",
        width: "100%",
        maxWidth: maxContentWidth,
        flexDirection: "row",
      }}
      {...panResponder.panHandlers}
    >
      {highlight}
      {filteredRoutes.map((route) => {
        const active = route.name === activeName;
        const label = labels[route.name] ?? route.name;
        const icon = icons[route.name as keyof typeof icons] ?? Home01Icon;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active }}
            onPress={() => navigateToRoute(route)}
            style={{
              flex: 1,
              minHeight: TAB_BAR_CONTENT_HEIGHT,
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              paddingVertical: spacing.xs,
            }}
          >
            <View
              style={{
                width: HIGHLIGHT_WIDTH,
                height: HIGHLIGHT_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TabIcon
                icon={icon}
                active={active}
                size={active ? 24 : 20}
                label={label}
                theme={theme}
                unread={route.name === "messages" && unread}
              />
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontSize: type.small,
                color: active ? theme.accentForeground : theme.mutedForeground,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return isLiquidGlassSupported ? (
    <LiquidGlassView
      accessibilityRole="tablist"
      effect="clear"
      colorScheme={mode}
      style={barBorderStyle}
    >
      {items}
    </LiquidGlassView>
  ) : (
    <View accessibilityRole="tablist" style={[{ backgroundColor: theme.glassBgStrong }, barBorderStyle]}>
      {items}
    </View>
  );
}

function TabIcon({
  icon,
  active,
  size,
  label,
  theme,
  unread,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  active: boolean;
  size: number;
  label: string;
  theme: ReturnType<typeof useTheme>;
  unread: boolean;
}) {
  return (
    <>
      <HugeiconsIcon
        icon={icon}
        size={size}
        strokeWidth={2}
        color={active ? theme.accentForeground : theme.mutedForeground}
      />
      {unread && (
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
    </>
  );
}
