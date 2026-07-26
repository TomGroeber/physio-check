/** Unit-/Komponententests der Patienten-App (jest-expo). */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  // jest-expo's Default lässt nur bekannte Expo-/RN-Pakete unter
  // node_modules transformieren; @callstack/liquid-glass liefert ESM
  // und muss daher zusätzlich in die Erlaubnisliste aufgenommen werden.
  transformIgnorePatterns: [
    "node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|@callstack/liquid-glass))",
  ],
};
