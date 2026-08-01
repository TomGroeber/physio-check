import { expect, test, type Page } from "@playwright/test";

/**
 * Mitternacht-/Sommerzeit-/Winterzeit-Grenzfälle für Terminanlagen – im
 * ursprünglichen Terminfehler-Auftrag als offene Testszenarien benannt
 * (s. TASKS.md/docs/TEST_MATRIX.md, Phase B/C). Reine End-to-End-Prüfung
 * über die echte Oberfläche; die Zeitzonen-Mathematik selbst ist bereits
 * unit-getestet (packages/shared/src/datetime.test.ts, DST-Grenzen für
 * Europe/Luxembourg 2026: 29.03. Sommerzeit-Beginn, 25.10. Winterzeit-
 * Beginn – hier bewusst der nächste noch in der Zukunft liegende
 * Sommerzeit-Übergang, 28.03.2027, da 29.03.2026 zum Testzeitpunkt bereits
 * vergangen ist und Termine nicht rückwirkend angelegt werden können).
 * Läuft seriell und nur einmal (chromium), weil echte Termine entstehen.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutierender Ablauf läuft nur einmal.");
});

const PASSWORD = "PhysioDemo2026!";
const PRACTICE_TZ = "Europe/Luxembourg";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

function dateInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function fillAppointmentForm(
  page: Page,
  { date, startTime }: { date: string; startTime: string }
) {
  await page.selectOption("#patientProfileId", { label: "Petra Beispielfrau" });
  await page.selectOption("#therapistMemberId", { label: "Tina Beispiel" });
  await page.fill("#date", date);
  await page.fill("#startTime", startTime);
}

async function createAndVerify(page: Page, date: string, startTime: string) {
  await page.goto("/practice/calendar/new");
  await fillAppointmentForm(page, { date, startTime });
  await page.getByRole("button", { name: "Termin speichern" }).click();
  await page.waitForURL(/\/practice\/calendar\/[0-9a-f-]+$/);
  // Ein noch geplanter Termin zeigt auf der Detailseite das Bearbeitungs-
  // formular (Startzeit im Eingabefeld, nicht als reiner Text) – die
  // Klartext-Zusammenfassung erscheint erst nach Abschluss/Stornierung.
  await expect(page.locator("#startTime")).toHaveValue(startTime);

  // Auch in der Tagesansicht des Kalenders auf genau diesem Kalendertag.
  await page.goto(`/practice/calendar?view=day&date=${date}`);
  await expect(page.getByText(startTime, { exact: false })).toBeVisible();
}

// Pro Lauf unterschiedliche Minute (analog zu appointments.spec.ts), damit
// ein Playwright-Retry oder ein erneuter lokaler Lauf nicht auf einen
// bereits vorhandenen Termin aus einem vorherigen (fehlgeschlagenen)
// Versuch trifft.
function uniqueMinute(): string {
  return String(Math.floor((Date.now() / 1000) % 12) * 5).padStart(2, "0");
}

test("Termin über die Sommerzeit-Umstellung (28.03.2027) hinweg zeigt die richtige Uhrzeit", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await createAndVerify(page, "2027-03-28", `14:${uniqueMinute()}`);
});

test("Termin über die Winterzeit-Umstellung (25.10.2026) hinweg zeigt die richtige Uhrzeit", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await createAndVerify(page, "2026-10-25", `15:${uniqueMinute()}`);
});

test("Termin kurz vor Mitternacht bleibt auf dem gewählten Kalendertag", async ({ page }) => {
  // Tagesoffset pro Lauf leicht variiert (statt der Uhrzeit, die hier
  // bewusst nah an Mitternacht bleiben soll), damit ein Retry nicht auf
  // einen Termin aus einem vorherigen Versuch trifft.
  const dayOffset = 40 + (Math.floor(Date.now() / 1000) % 10);
  const future = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000);
  const date = dateInTz(future, PRACTICE_TZ);
  await login(page, "therapeutin@demo.physiocheck.test");
  // 23:55 lokal liegt in Europe/Luxembourg (UTC+1/+2) bereits am
  // folgenden UTC-Kalendertag – genau das soll die Anzeige nicht
  // durcheinanderbringen.
  await createAndVerify(page, date, "23:55");
});
