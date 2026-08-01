import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "PhysioDemo2026!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test("Hilfecenter zeigt alle Themenbereiche und lässt sich per Sidebar erreichen", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.getByRole("link", { name: "Hilfe" }).click();
  await expect(page).toHaveURL(/\/practice\/help$/);
  await expect(page.getByRole("heading", { name: "Hilfecenter" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Termine & Kalender" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Schnellsuche" })).toBeVisible();
});

test("Suche im Hilfecenter blendet nicht passende Themen aus und öffnet Treffer automatisch", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/help");
  await page.getByLabel("Hilfeartikel durchsuchen").fill("Schadsoftware");
  await expect(page.getByText(/Werden hochgeladene Dateien auf Schadsoftware geprüft/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Termine & Kalender" })).toHaveCount(0);
});

test("Suchbegriff ohne Treffer zeigt einen Hinweis", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/help");
  await page.getByLabel("Hilfeartikel durchsuchen").fill("xyzxyz-kein-artikel");
  await expect(page.getByText("Keine Hilfeartikel zu diesem Suchbegriff gefunden.")).toBeVisible();
});

test("Hilfe ist auch über die Schnellsuche erreichbar", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice");
  await page.getByText("Demo-Praxis").waitFor();
  await page.keyboard.press("Control+k");
  await page.getByRole("option", { name: "Hilfe" }).click();
  await expect(page).toHaveURL(/\/practice\/help$/);
});
