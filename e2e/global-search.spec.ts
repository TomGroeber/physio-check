import { expect, test, type Page } from "@playwright/test";

/**
 * Phase-J-Browserabdeckung für die praxisweite Schnellsuche (Strg/Cmd+K).
 * Rein lesend – kein serieller Modus nötig, läuft auf allen Projekten.
 */
const PASSWORD = "PhysioDemo2026!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test("Schnellsuche öffnet sich per Klick und zeigt Bereiche ohne Eingabe", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.getByRole("button", { name: /Schnellsuche/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("option", { name: "Patienten" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Kalender" })).toBeVisible();
});

test("Schnellsuche öffnet sich per Tastenkürzel und schließt per Escape", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("Patientensuche findet einen Treffer und springt per Enter zur Patientenseite", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder(/Patienten, Übungen/);
  await input.fill("Petra");
  await expect(page.getByRole("option", { name: /Petra Beispielfrau/ })).toBeVisible();
  await input.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/practice\/patients\/[0-9a-f-]+$/);
});

test("Übungssuche findet einen Treffer und springt per Klick zur Übungsseite", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.keyboard.press("Control+k");
  const input = page.getByPlaceholder(/Patienten, Übungen/);
  await input.fill("Brücke");
  const option = page.getByRole("option", { name: /Brücke \(Beckenheben\)/ });
  await option.waitFor();
  await option.click();
  await expect(page).toHaveURL(/\/practice\/exercises\/[0-9a-f-]+$/);
});

test("Ein Zeichen zeigt einen Hinweis statt vorzeitiger Treffer", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder(/Patienten, Übungen/).fill("P");
  await expect(page.getByText("Mindestens 2 Zeichen eingeben.")).toBeVisible();
});

test("Freierfundener Suchbegriff ohne Treffer zeigt eine leere Trefferliste", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder(/Patienten, Übungen/).fill("xyzxyzxyz-kein-treffer");
  await expect(page.getByText("Keine Treffer.")).toBeVisible();
});
