import { expect, test, type Page } from "@playwright/test";

/**
 * Terminfehler (Juli 2026): Neue Termine landeten teils sofort bei
 * "Vergangene Termine" statt bei "Kommende Termine", weil das
 * Anlage-Formular Datum/Uhrzeit ohne Zukunfts-Prüfung übernahm (Default
 * war "heute, 09:00" – nach 9 Uhr lag das bereits in der Vergangenheit).
 * Läuft seriell und nur einmal (chromium), weil es echte Termine anlegt.
 */

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Mutierender Ablauf (echte Termine) läuft nur einmal."
  );
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

/**
 * Uhrzeit in 5-Minuten-Schritten, passend zum `step={300}` des
 * Startzeit-Felds (native HTML5-Validierung blockiert sonst das
 * Absenden lautlos, ganz ohne Netzwerk-Request oder Fehlermeldung).
 */
function timeInTz(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const rawMinute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const minute = String(Math.floor(rawMinute / 5) * 5).padStart(2, "0");
  return `${hour}:${minute}`;
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

test("Praxis kann keinen Termin in der Vergangenheit fest buchen", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/calendar/new");

  const now = new Date();
  // Rund 10-15 Minuten in der Vergangenheit (auf 5-Minuten-Schritt
  // abgerundet), in der Praxis-Zeitzone – bewusst nah an "jetzt", um genau
  // den gemeldeten Fall (heutiges Datum, bereits verstrichene Uhrzeit)
  // abzudecken statt eines offensichtlich alten Datums.
  const pastTime = timeInTz(new Date(now.getTime() - 10 * 60_000), PRACTICE_TZ);
  await fillAppointmentForm(page, { date: dateInTz(now, PRACTICE_TZ), startTime: pastTime });
  await page.getByRole("button", { name: "Termin speichern" }).click();

  await expect(page.getByText(/liegt in der Vergangenheit/i)).toBeVisible();
  // Kein Redirect zur Kalenderseite – das Formular bleibt mit der
  // Fehlermeldung stehen, es wurde kein Termin angelegt.
  await expect(page).toHaveURL(/\/practice\/calendar\/new/);
});

test("Fest gebuchter zukünftiger Termin erscheint sofort beim Patienten unter Kommenden Terminen", async ({
  browser,
}) => {
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await login(staffPage, "therapeutin@demo.physiocheck.test");
  await staffPage.goto("/practice/calendar/new");

  // Weit in der Zukunft und mit einer pro Lauf unterschiedlichen Uhrzeit,
  // damit dieser Test verlässlich ist, egal welche anderen Termine (Seed-
  // Daten oder frühere Läufe) im Kalender bereits stehen.
  const future = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
  const date = dateInTz(future, PRACTICE_TZ);
  const minute = String(Math.floor((Date.now() / 60_000) % 12) * 5).padStart(2, "0");
  const startTime = `11:${minute}`;
  await fillAppointmentForm(staffPage, { date, startTime });
  await staffPage.getByRole("button", { name: "Termin speichern" }).click();

  // Erfolgreiches Anlegen leitet auf die Termindetailseite im Kalender um.
  await staffPage.waitForURL(/\/practice\/calendar\/[0-9a-f-]+$/);
  await staffContext.close();

  const patientContext = await browser.newContext();
  const patientPage = await patientContext.newPage();
  await login(patientPage, "patientin@demo.physiocheck.test");
  await patientPage.goto("/appointments");

  const upcomingSection = patientPage
    .locator("section")
    .filter({ has: patientPage.getByRole("heading", { name: "Kommende Termine" }) });
  await expect(upcomingSection).toContainText(startTime);
  // Nicht im (eingeklappten) Bereich "Vergangene Termine".
  const pastToggle = patientPage.getByText(/Vergangene Termine/i);
  if (await pastToggle.count()) {
    await expect(pastToggle).not.toContainText(startTime);
  }
  await patientContext.close();
});
