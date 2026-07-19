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
  // Spitzenlast begrenzen: mit unbegrenzten Workern überschreiten einzelne
  // Server-Action-Roundtrips gelegentlich die 10-s-Erwartung (bekannter
  // Hänger, siehe docs/AI_HANDOFF.md). Vier Worker halten den Lauf schnell
  // und deutlich stabiler.
  workers: 4,
  reporter: "list",
  // Alle Projekte laufen parallel gegen EINEN lokalen Server; unter
  // Spitzenlast kann eine einzelne Server-Action die 5s-Vorgabe reißen,
  // ohne dass etwas kaputt ist. 15s hält das Signal, entfernt das Rauschen
  // (bei inzwischen >50 Fällen reichte 10s nicht mehr zuverlässig).
  expect: { timeout: 15_000 },
  // Testtimeout (Default 30s) anheben: page.goto fällt nicht unter den
  // expect-Timeout, und einzelne Navigationen können unter Spitzenlast
  // >30s dauern. Achtung: Hängen Navigationen trotzdem dauerhaft und
  // loggt der WebServer ChunkLoadErrors, ist der Turbopack-Cache nach
  // wiederholten DB-Resets verkeilt – dann `rm -rf .next` (19.07.2026
  // verifiziert: Suite danach vollständig grün und am schnellsten).
  timeout: 60_000,
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
