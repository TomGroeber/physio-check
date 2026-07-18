import { expect, test, type Page } from "@playwright/test";

/**
 * Kernablauf Phase C (Zielstrecke):
 * Konto ohne Einladung registrieren → E-Mail bestätigen (Mailpit) →
 * anmelden → Code der Praxis einlösen → verbunden → Übung
 * dokumentieren → Fortschritt aktualisiert → Therapeutin sieht die
 * Selbstauskunft auf der Patientendetailseite.
 *
 * Voraussetzung: `supabase start` und frischer `pnpm seed`.
 * Läuft bewusst seriell und nur einmal (chromium), weil er Daten anlegt.
 */

test.describe.configure({ mode: "serial" });

const PASSWORD = "PhysioDemo2026!";
const MAILPIT = "http://127.0.0.1:54324";
const uniqueSuffix = Date.now().toString(36);
const patientEmail = `e2e-patient-${uniqueSuffix}@example.com`;
const patientName = `Emil Endezuende ${uniqueSuffix}`;
let inviteCode = "";

test.beforeEach(async ({}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "Kernablauf läuft nur einmal, weil er Daten verändert."
  );
});

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByLabel("Passwort").fill(password);
  await page.getByRole("button", { name: "Anmelden" }).click();
  // Warten, bis die Anmeldung durch ist (Weiterleitung weg von /login),
  // sonst überholt der nächste goto() das Setzen der Session-Cookies.
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Bestätigungslink aus Mailpit holen (lokaler E-Mail-Fänger). */
async function fetchConfirmationLink(recipient: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const search = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${recipient}`)}`
    ).then((r) => r.json());
    const id = search?.messages?.[0]?.ID;
    if (id) {
      const message = await fetch(`${MAILPIT}/api/v1/message/${id}`).then((r) =>
        r.json()
      );
      const body: string = `${message.HTML ?? ""}\n${message.Text ?? ""}`;
      const match = body
        .replace(/&amp;/g, "&")
        .match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify[^"'\s<)]+/);
      if (match) return match[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Keine Bestätigungs-E-Mail für ${recipient} gefunden.`);
}

test("Konto ohne Einladung registrieren und E-Mail bestätigen", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Vor- und Nachname").fill(patientName);
  await page.getByLabel("E-Mail-Adresse").fill(patientEmail);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await expect(page.getByText(/Fast geschafft/)).toBeVisible();

  const confirmLink = await fetchConfirmationLink(patientEmail);
  await page.goto(confirmLink);
  // Nach der Bestätigung landet das unverbundene Konto im Verbindungsbereich.
  await expect(page).toHaveURL(/\/connect/);
  await expect(
    page.getByRole("heading", { name: "Mit Ihrer Praxis verbinden" })
  ).toBeVisible();
});

test("Unverbundenes Konto sieht keine Patienten- oder Praxisdaten", async ({ page }) => {
  await login(page, patientEmail);
  await expect(page).toHaveURL(/\/connect$/);
  await page.goto("/today");
  await expect(page).toHaveURL(/\/connect$/);
  await page.goto("/practice");
  await expect(page).not.toHaveURL(/\/practice/);
});

test("Therapeutin erstellt einen Einladungscode", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/patients/new");
  await page.getByLabel("Name des Patienten").fill(patientName);
  await page.getByRole("button", { name: "Einladungscode erzeugen" }).click();
  const codeField = page.getByLabel("Einladungscode", { exact: true });
  await expect(codeField).toBeVisible();
  inviteCode = (await codeField.inputValue()).trim();
  expect(inviteCode.replace(/-/g, "")).toHaveLength(12);
});

test("Code verbindet das Konto genau einmal; falscher Code wird abgewiesen", async ({ page }) => {
  await login(page, patientEmail);
  await expect(page).toHaveURL(/\/connect$/);

  // Falscher Code: konstante, neutrale Fehlermeldung
  await page.getByLabel("Ihr Code von der Praxis").fill("AAAA-BBBB-CC22");
  await page.getByRole("button", { name: "Verbinden" }).click();
  await expect(page.getByText(/ungültig oder abgelaufen/)).toBeVisible();

  // Richtiger Code: Bestätigung mit Praxisname, dann Verbindung
  await page.getByLabel("Ihr Code von der Praxis").fill(inviteCode);
  await page.getByRole("button", { name: "Verbinden" }).click();
  await expect(page.getByText("Demo-Praxis Sonnenbrücke")).toBeVisible();
  await page
    .getByRole("button", { name: "Verbindung zur Praxis bestätigen" })
    .click();
  await expect(page).toHaveURL(/\/today/);

  // Derselbe Code ist verbraucht: erneute Eingabe schlägt fehl
  await page.goto("/connect");
  await page.getByLabel("Ihr Code von der Praxis").fill(inviteCode);
  await page.getByRole("button", { name: "Verbinden" }).click();
  await expect(page.getByText(/ungültig oder abgelaufen/)).toBeVisible();
});

test("Patientin dokumentiert eine Übung; Fortschritt aktualisiert sich", async ({ page }) => {
  await login(page, "patientin@demo.physiocheck.test");
  await expect(page).toHaveURL(/\/today$/);
  await expect(page.getByText("0 von 3 geschafft")).toBeVisible();

  await page.getByRole("link", { name: /Übung „Schulterkreisen“ öffnen/ }).click();
  await expect(page.getByRole("heading", { name: "Schulterkreisen" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Durchführung dokumentieren" })
  ).toBeVisible();

  await page.getByRole("radio", { name: "Erledigt", exact: true }).check();
  await page.getByText("Weitere Angaben (optional)").click();
  await page.getByLabel("Absolvierte Sätze (optional)").fill("2");
  await page.getByLabel("Schmerz vor der Übung (optional)").selectOption("3");
  await page.getByLabel("Schmerz nach der Übung (optional)").selectOption("2");
  await page
    .getByLabel("Notiz an Ihre Praxis (optional)")
    .fill("Heute gut machbar gewesen.");
  await page.getByRole("button", { name: "Dokumentation speichern" }).click();

  await expect(page).toHaveURL(/\/today\?logged=completed/);
  await expect(page.getByRole("status").filter({ hasText: "Geschafft!" })).toBeVisible();
  await expect(page.getByText("1 von 3 geschafft")).toBeVisible();

  // Doppelte Tagesdokumentation ist nicht möglich
  await page.getByRole("link", { name: /Übung „Schulterkreisen“ öffnen/ }).click();
  await expect(page.getByText("Heute dokumentiert", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Dokumentation speichern" })
  ).toHaveCount(0);
});

test("Therapeutin sieht die Selbstauskunft auf der Patientendetailseite", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/patients");
  await page.getByRole("link", { name: /Petra Beispielfrau/ }).click();
  await expect(
    page.getByRole("heading", { name: "Petra Beispielfrau" })
  ).toBeVisible();
  await expect(page.getByText(/Alle Angaben sind Selbstauskünfte/)).toBeVisible();
  await expect(page.getByText("Schulterkreisen").first()).toBeVisible();
  await expect(page.getByText("Heute gut machbar gewesen.")).toBeVisible();
  await expect(page.getByText("Schmerz nachher: 2/10")).toBeVisible();
});
