import { expect, test } from "@playwright/test";

/**
 * Angemeldete Abläufe mit den Demo-Konten.
 * Voraussetzung: `supabase start` und `pnpm seed` wurden ausgeführt.
 */

const PASSWORD = "PhysioDemo2026!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  // Warten, bis die Anmeldung durch ist (Weiterleitung weg von /login),
  // sonst überholt der nächste goto() das Setzen der Session-Cookies.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

test("Patientin landet auf 'Heute' und sieht Übungen und Termin", async ({
  page,
}) => {
  await login(page, "patientin@demo.physiocheck.test");
  await expect(page).toHaveURL(/\/today$/);
  await expect(
    page.getByRole("heading", { name: "Ihre Übungen heute" })
  ).toBeVisible();
  await expect(page.getByText("Brücke (Beckenheben)")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ihr nächster Termin" })
  ).toBeVisible();
  // Untere Navigation: genau die drei Hauptbereiche
  await expect(
    page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link")
  ).toHaveCount(3);
});

test("Patientenprofil trennt persönliche Daten, Sicherheit und Einstellungen", async ({ page }) => {
  await login(page, "patientin@demo.physiocheck.test");
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Persönliche Daten" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sicherheit" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Erinnerungen" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ihre Praxis" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "E-Mail-Adresse ändern" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Passwort ändern" })).toBeVisible();
});

test("Patientin sieht nur eigene Bereiche – Praxisbereich wird umgeleitet", async ({
  page,
}) => {
  await login(page, "patientin@demo.physiocheck.test");
  await expect(page).toHaveURL(/\/today$/);
  await page.goto("/practice");
  await expect(page).not.toHaveURL(/\/practice/);
});

test("Therapeutin landet im Praxis-Dashboard", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await expect(page).toHaveURL(/\/practice$/);
  await expect(page.getByRole("heading", { name: "Übersicht" })).toBeVisible();
  await expect(page.getByText("Heutige Termine")).toBeVisible();
  // Selbstauskunfts-Hinweis ist sichtbar (keine falsche Verifikationsbehauptung)
  await expect(page.getByText(/Selbstauskünfte/)).toBeVisible();
});

test("Therapeutin sieht die Übungsbibliothek der Praxis", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.getByRole("link", { name: "Übungsbibliothek" }).click();
  // Erst die Zielseite abwarten: das Dashboard enthält „Wandsitz“ ebenfalls
  // (Rückmeldungslisten), was sonst zu einem mehrdeutigen Treffer führt.
  await page.waitForURL(/\/practice\/exercises$/);
  await expect(page.getByText("Wandsitz").first()).toBeVisible();
});

test("Unverbundenes Konto sieht nur den Verbindungsbereich", async ({
  page,
}) => {
  await login(page, "eingeladen@demo.physiocheck.test");
  await expect(page).toHaveURL(/\/connect$/);
  await expect(
    page.getByRole("heading", { name: "Mit Ihrer Praxis verbinden" })
  ).toBeVisible();
  // Basisdaten und Abmeldung sind sichtbar, aber keine Patientenbereiche
  await expect(page.getByRole("heading", { name: "Ihr Konto" })).toBeVisible();
  await page.goto("/today");
  await expect(page).toHaveURL(/\/connect$/);
  await page.goto("/practice");
  await expect(page).not.toHaveURL(/\/practice/);
  await page.goto("/appointments");
  await expect(page).toHaveURL(/\/connect$/);
});
