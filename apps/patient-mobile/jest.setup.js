// Safe-Area ohne natives Modul (offizieller Jest-Mock der Bibliothek).
jest.mock("react-native-safe-area-context", () =>
  require("react-native-safe-area-context/jest/mock").default
);

// AsyncStorage ohne natives Modul (offizieller Jest-Mock).
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Umgebungsvariablen für Tests (kein echtes Backend nötig).
process.env.EXPO_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
process.env.EXPO_PUBLIC_SUPABASE_KEY = "sb_publishable_test";
process.env.EXPO_PUBLIC_API_BASE_URL = "http://127.0.0.1:3000";
