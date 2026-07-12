import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-End-Tests. Voraussetzung: lokales Supabase läuft
 * (`supabase start`). Der Next.js-Dev-Server wird automatisch gestartet.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Ein Wiederholungsversuch: Unter voller Parallellast hängt selten ein
  // einzelner Server-Action-Roundtrip (untersucht 2026-07-12: nicht in der
  // DB, nicht isoliert reproduzierbar). Der Retry zeichnet dank
  // trace:"on-first-retry" automatisch einen Trace zur Analyse auf.
  retries: 1,
  reporter: "list",
  // Alle Projekte laufen parallel gegen EINEN lokalen Server; unter
  // Spitzenlast kann eine einzelne Server-Action die 5s-Vorgabe reißen,
  // ohne dass etwas kaputt ist. 10s hält das Signal, entfernt das Rauschen.
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 14"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
