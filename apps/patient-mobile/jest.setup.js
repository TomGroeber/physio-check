// Safe-Area ohne natives Modul (offizieller Jest-Mock der Bibliothek).
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

// AsyncStorage ohne natives Modul (offizieller Jest-Mock).
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Liquid Glass ohne natives Modul (kein offizieller Jest-Mock vorhanden):
// Tests laufen im Fallback-Pfad (isLiquidGlassSupported = false), die
// Komponente wird durch eine einfache View ersetzt.
jest.mock("@callstack/liquid-glass", () => {
  const { View } = require("react-native");
  return {
    LiquidGlassView: View,
    LiquidGlassContainerView: View,
    isLiquidGlassSupported: false,
  };
});

// Umgebungsvariablen für Tests (kein echtes Backend nötig).
process.env.EXPO_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.EXPO_PUBLIC_SUPABASE_KEY = "sb_publishable_test";
process.env.EXPO_PUBLIC_API_BASE_URL = "http://127.0.0.1:3000";
