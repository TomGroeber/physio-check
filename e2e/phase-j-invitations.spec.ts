import { expect, test, type Page } from "@playwright/test";

/** Zusätzliche reale Einladungswege für Phase J (nur lokal, seriell). */
test.describe.configure({ mode: "serial" });

const PASSWORD = "PhysioDemo2026!";
const MAILPIT = "http://127.0.0.1:54324";
const suffix = Date.now().toString(36);
const invitedEmail = `invite-first-${suffix}@example.com`;
const invitedName = `Ina Einladung ${suffix}`;
let inviteFirstCode = "";
let existingAccountCode = "";

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

async function createInvite(page: Page, name: string): Promise<string> {
  await page.goto("/practice/patients/new");
  await page.getByLabel("Name des Patienten").fill(name);
  await page.getByRole("button", { name: "Einladungscode erzeugen" }).click();
  return (await page.getByLabel("Einladungscode", { exact: true }).inputValue()).trim();
}

async function fetchConfirmationLink(recipient: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const search = await fetch(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${recipient}`)}`
    ).then((response) => response.json());
    const id = search?.messages?.[0]?.ID;
    if (id) {
      const message = await fetch(`${MAILPIT}/api/v1/message/${id}`).then((response) =>
        response.json()
      );
      const body = `${message.HTML ?? ""}\n${message.Text ?? ""}`;
      const match = body
        .replace(/&amp;/g, "&")
        .match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify[^"'\s<)]+/);
      if (match) return match[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Keine Bestätigungs-E-Mail für ${recipient} gefunden.`);
}

test("Code wird vor Kontoerstellung geprüft und erst nach Bestätigung eingelöst", async ({
  page,
}) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  inviteFirstCode = await createInvite(page, invitedName);
  await page.context().clearCookies();

  await page.goto("/invite");
  await page.getByLabel("Ihr Code von der Praxis").fill(inviteFirstCode);
  await page.getByRole("button", { name: "Verbinden" }).click();
  await expect(page).toHaveURL(/\/invite\/continue/);
  await expect(page.getByText(`Einladung für ${invitedName}`)).toBeVisible();
  await page.getByRole("link", { name: "Neues Konto erstellen" }).click();
  await page.getByLabel("Vor- und Nachname").fill(invitedName);
  await page.getByLabel("E-Mail-Adresse").fill(invitedEmail);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Konto erstellen" }).click();
  await expect(page.getByText(/Fast geschafft/)).toBeVisible();

  const confirmationLink = await fetchConfirmationLink(invitedEmail);
  await page.goto(confirmationLink);
  await expect(page).toHaveURL(/\/connect/);
  await expect(page.getByText(`Einladung für ${invitedName}`)).toBeVisible();
  await page.getByRole("button", { name: "Verbindung zur Praxis bestätigen" }).click();
  await expect(page).toHaveURL(/\/today\?connected=1/);

  // Erst jetzt ist der Code verbraucht.
  await page.context().clearCookies();
  await page.goto("/invite");
  await page.getByLabel("Ihr Code von der Praxis").fill(inviteFirstCode);
  await page.getByRole("button", { name: "Verbinden" }).click();
  await expect(page.getByText(/ungültig oder abgelaufen/)).toBeVisible();
});

test("Bestehendes Konto nimmt Einladung an und bleibt auf neuem Gerät verbunden", async ({
  page,
  browser,
}) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  existingAccountCode = await createInvite(page, "Petra Beispielfrau");
  await page.context().clearCookies();

  await page.goto("/invite");
  await page.getByLabel("Ihr Code von der Praxis").fill(existingAccountCode);
  await page.getByRole("button", { name: "Verbinden" }).click();
  await page.getByRole("link", { name: "Mit bestehendem Konto anmelden" }).click();
  await page.getByLabel("E-Mail-Adresse").fill("patientin@demo.physiocheck.test");
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page).toHaveURL(/\/connect/);
  await page.getByRole("button", { name: "Verbindung zur Praxis bestätigen" }).click();
  await expect(page).toHaveURL(/\/today\?connected=1/);

  const newDevice = await browser.newContext();
  const newPage = await newDevice.newPage();
  await login(newPage, "patientin@demo.physiocheck.test");
  await expect(newPage).toHaveURL(/\/today$/);
  await expect(newPage.getByRole("heading", { name: "Ihre Übungen heute" })).toBeVisible();
  await newDevice.close();
});

