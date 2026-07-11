import { expect, test } from "@playwright/test";

/**
 * Rauchtests der Auth-Seiten: Seiten laden, deutsche Beschriftungen
 * sind da, Grund-Navigation funktioniert. Der vollständige
 * Der datenbankgestützte Einladungsablauf benötigt die lokale Supabase-Instanz.
 */

test("Startseite bietet Registrierung, Anmeldung und Codeeingabe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Ihre Übungen und Termine an einem Ort" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Neues Konto erstellen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ich habe bereits ein Konto" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ich habe einen Einladungscode" })).toBeVisible();
});

test("Login-Seite: Felder und Links vorhanden", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
  await expect(page.getByLabel("Passwort")).toBeVisible();
  await expect(page.getByRole("link", { name: "Konto erstellen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Passwort vergessen?" })).toBeVisible();
});

test("Falsche Zugangsdaten zeigen verständlichen Fehler", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill("gibtesnicht@example.com");
  await page.getByLabel("Passwort").fill("falsches-passwort");
  await page.getByRole("button", { name: "Anmelden" }).click();
  // .filter, weil Next.js zusätzlich einen leeren Route-Announcer mit role=alert rendert
  await expect(
    page.getByRole("alert").filter({ hasText: "stimmen nicht" })
  ).toBeVisible();
});

test("Registrierung ist ohne Einladung erreichbar", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Konto erstellen" })).toBeVisible();
  await expect(page.getByLabel("Vor- und Nachname")).toBeVisible();
  await expect(page.getByLabel("E-Mail-Adresse")).toBeVisible();
  await expect(page.getByLabel("Passwort")).toBeVisible();
});

test("Verbindungsbereich verlangt Anmeldung", async ({ page }) => {
  await page.goto("/connect");
  await expect(page).toHaveURL(/\/login$/);
});

test("Geschützter Bereich leitet zum Login um", async ({ page }) => {
  await page.goto("/practice");
  await expect(page).toHaveURL(/\/login$/);
});
