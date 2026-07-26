import { expect, test, type Page } from "@playwright/test";

/**
 * Nachrichtenfunktion zwischen Patientin und aktuell verbundener
 * Praxis: Senden, Empfangen, Leerzustand, Praxis-Liste/Filter/Badge,
 * Sprung zum Patientenprofil. Serverseitige Mandantentrennung ist
 * bereits durch `pnpm test:rls` (Abschnitt F) abgedeckt - hier geht es
 * um die tatsächliche Oberfläche.
 */
test.describe.configure({ mode: "serial" });

const PASSWORD = "PhysioDemo2026!";

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutierender Ablauf läuft nur einmal.");
});

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test("untere Navigation zeigt vier Bereiche in der richtigen Reihenfolge", async ({ page }) => {
  await login(page, "patientin@demo.physiocheck.test");
  const nav = page.getByRole("navigation", { name: "Hauptnavigation" });
  const labels = await nav.getByRole("link").allTextContents();
  expect(labels).toEqual(["Heute", "Termine", "Nachrichten", "Profil"]);
});

test("Patientin sendet eine erste Nachricht; die Praxis sieht und beantwortet sie", async ({
  page,
  browser,
}) => {
  await login(page, "patientin@demo.physiocheck.test");
  await page.goto("/messages");
  await expect(page.getByText("Demo-Praxis Sonnenbrücke")).toBeVisible();

  // Eindeutiger Text pro Testlauf: die Unterhaltung ist unveränderlich
  // und wächst bei wiederholten Läufen an, ein fixer Text würde nach
  // dem zweiten Lauf mehrfach vorkommen (strict-mode violation).
  const messageText = `Hallo, ich habe eine Frage zu meinem Übungsplan. (${Date.now()})`;
  const composer = page.getByPlaceholder("Ihre Nachricht …");
  await composer.fill(messageText);
  await page.getByRole("button", { name: "Senden" }).click();
  await expect(page.getByText(messageText)).toBeVisible();
  await expect(page.getByText("Nachrichten werden nicht ständig überwacht")).toBeVisible();

  // Praxis sieht die Unterhaltung in einer eigenen Sitzung.
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await login(staffPage, "therapeutin@demo.physiocheck.test");
  await staffPage.goto("/practice/messages");
  const staffMain = staffPage.locator("main");
  const unreadBadge = staffMain.locator('[data-slot="badge"]', { hasText: "Ungelesen" });
  await expect(staffMain.getByText("Petra Beispielfrau")).toBeVisible();
  await expect(unreadBadge).toBeVisible();

  await staffMain.getByText("Petra Beispielfrau").click();
  await expect(staffPage.getByText(messageText)).toBeVisible();
  const replyText = `Klar, wie kann ich helfen? (${Date.now()})`;
  await staffPage.getByPlaceholder("Antwort schreiben …").fill(replyText);
  await staffPage.getByRole("button", { name: "Senden" }).click();
  await expect(staffPage.getByText(replyText)).toBeVisible();

  // Zurück zur Liste: die Unterhaltung ist nicht mehr ungelesen.
  await staffPage.goto("/practice/messages");
  await expect(unreadBadge).not.toBeVisible();

  // Sprung zum Patientenprofil und zurück.
  await staffMain.getByText("Petra Beispielfrau").click();
  await staffPage.getByRole("link", { name: "Zum Patientenprofil" }).click();
  await expect(staffPage).toHaveURL(/\/practice\/patients\//);
  await staffPage.getByRole("link", { name: "Nachrichten anzeigen" }).click();
  await expect(staffPage).toHaveURL(/\/practice\/messages\//);

  await staffContext.close();

  // Patientin sieht die Antwort nach dem Neuladen.
  await page.reload();
  await expect(page.getByText(replyText)).toBeVisible();
});

test("Praxis kann Unterhaltungen nach Patientin durchsuchen und filtern", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/messages");
  const main = page.locator("main");
  await expect(main.getByText("Petra Beispielfrau")).toBeVisible();

  await page.getByPlaceholder("Patient:in suchen …").fill("Nichtvorhanden");
  await page.getByRole("button", { name: "Suchen" }).click();
  await expect(main.getByText("Keine Unterhaltungen gefunden.")).toBeVisible();

  await page.goto("/practice/messages?filter=answered");
  await expect(main.getByText("Petra Beispielfrau")).toBeVisible();
  await page.goto("/practice/messages?filter=unread");
  await expect(main.getByText("Keine Unterhaltungen gefunden.")).toBeVisible();
});

test("unverbundenes Konto kommt nicht auf die Nachrichtenseite", async ({ page }) => {
  await login(page, "eingeladen@demo.physiocheck.test");
  await page.goto("/messages");
  await expect(page).toHaveURL(/\/connect/);
});
