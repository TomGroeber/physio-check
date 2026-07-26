import { LiquidGlassView, isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { radius } from "@/config/branding";
import { useReduceMotion, useReduceTransparency } from "@/lib/accessibility-preferences";
import { useTheme } from "@/lib/theme";

/**
 * Optischer Effekt-Layer über der nativen Glasfläche (`@callstack/
 * liquid-glass`): Apples öffentliche API liefert Unschärfe/Lensing,
 * aber keine steuerbaren Parameter für sichtbare Reflexionsbögen oder
 * Farbsäume (s. DECISIONS.md D-108/D-112) – das wird hier bewusst
 * simuliert (kein Anspruch auf echte physikalische Lichtbrechung):
 * zwei Hochlicht-Bögen (Haupt- und Gegenreflex), dünne cyan-/
 * magentafarbene Randstreifen, ein räumlicher Glasrand und ein beim
 * Tab-Wechsel wandernder Schimmer. Rein dekorativ – `pointerEvents:
 * "none"` überall, beeinflusst nie Touch/Ziehen/Navigation.
 */
export function LiquidLens({
  width,
  height,
  colorScheme,
  interactive,
  shimmerTrigger,
}: {
  width: number;
  height: number;
  colorScheme: "light" | "dark";
  interactive: boolean;
  /** Löst bei jeder Änderung einen neuen Schimmer-Durchlauf aus (z. B. der Name des aktiven Tabs). */
  shimmerTrigger: string;
}) {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const reduceTransparency = useReduceTransparency();

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    shimmer.setValue(0);
    Animated.timing(shimmer, {
      toValue: 1,
      duration: 480,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shimmerTrigger, reduceMotion]);

  // `.interpolate()` on a persisted `Animated.Value` (s. Begründung in
  // tab-bar.tsx: Reacts eigenes offizielles Animated-Muster) wird von
  // der neuen react-hooks/refs-Regel fälschlich als Ref-Lesezugriff
  // während des Renderns markiert – der Wert selbst ändert sich nie
  // synchron hier, nur über `.setValue()`/`Animated.timing()` in Effects.
  // eslint-disable-next-line react-hooks/refs
  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });
  // eslint-disable-next-line react-hooks/refs
  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.15, 0.85, 1],
    outputRange: [0, 1, 1, 0],
  });

  const baseRadius = radius.full;

  // Kontrastreicher, undurchsichtiger Ersatz statt Transparenz – bleibt
  // trotzdem räumlich (Rand + Hochlicht), erfüllt aber „Transparenz
  // reduzieren" ohne auf durchscheinendes Material zu bauen.
  if (reduceTransparency) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius: baseRadius,
          overflow: "hidden",
          backgroundColor: theme.accent,
          borderWidth: 1.5,
          borderColor: theme.accentForeground,
        }}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
          start={[0.1, 0.05]}
          end={[0.7, 0.65]}
          style={{ position: "absolute", top: 0, left: 0, width: "70%", height: "60%" }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        width,
        height,
        borderRadius: baseRadius,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.24,
        shadowRadius: 6,
        elevation: 5,
      }}
    >
      <View style={{ flex: 1, borderRadius: baseRadius, overflow: "hidden" }}>
        {isLiquidGlassSupported ? (
          <LiquidGlassView
            effect="regular"
            colorScheme={colorScheme}
            interactive={interactive}
            tintColor={theme.glassAccent}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.glassAccent }]} />
        )}

        {/* Cyan-Kante (oben) und Magenta-Kante (unten) – Farbsäume nur an
            den Rändern, nie ein voll eingefärbter Kreis, aber deutlich
            genug, um auch für Laien sofort erkennbar zu sein. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(100,195,255,0.68)", "rgba(100,195,255,0)"]}
          start={[0.5, 0]}
          end={[0.5, 1]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%" }}
        />
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0)", "rgba(230,120,255,0.55)"]}
          start={[0.5, 0]}
          end={[0.5, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%" }}
        />

        {/* Haupt-Reflexionsbogen oben links. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]}
          start={[0.08, 0.05]}
          end={[0.62, 0.6]}
          style={{ position: "absolute", top: 0, left: 0, width: "72%", height: "58%" }}
        />
        {/* Gegenreflex unten rechts, deutlich subtiler. */}
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.45)"]}
          start={[0.4, 0.4]}
          end={[1, 1]}
          style={{ position: "absolute", bottom: 0, right: 0, width: "55%", height: "45%" }}
        />

        {/* Räumlicher Glasrand. */}
        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFill,
            borderRadius: baseRadius,
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.7)",
          }}
        />

        {/* Wandernder Schimmer beim Tab-Wechsel. */}
        {!reduceMotion && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: width * 0.55,
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerTranslate }, { rotate: "18deg" }],
            }}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.6)", "rgba(255,255,255,0)"]}
              start={[0, 0.5]}
              end={[1, 0.5]}
              style={{ flex: 1 }}
            />
          </Animated.View>
        )}
      </View>
    </View>
  );
}
