/** Unit-/Komponententests der Patienten-App (jest-expo). */
module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
};
