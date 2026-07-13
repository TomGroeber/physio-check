import { expect, test, type Page } from "@playwright/test";

/**
 * Phase-J-Browserabdeckung für Bibliothek und private Übungsmedien.
 * Benötigt eine frisch zurückgesetzte/gesäete lokale Supabase-Instanz.
 */
test.describe.configure({ mode: "serial" });

const PASSWORD = "PhysioDemo2026!";
const suffix = Date.now().toString(36);
const originalTitle = `E2E Mobilisation ${suffix}`;
const editedTitle = `${originalTitle} bearbeitet`;

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

test("Praxis legt eine Übung an, bearbeitet, dupliziert und archiviert sie", async ({
  page,
}) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/exercises/new");
  await page.getByLabel("Titel").fill(originalTitle);
  await page.getByLabel("Kurzbeschreibung").fill("Fiktive E2E-Testübung.");
  await page.getByLabel("Kategorie / Körperregion").fill("E2E-Test");
  await page.getByRole("button", { name: "Übung anlegen" }).click();
  await expect(page).toHaveURL(/\/practice\/exercises\/[0-9a-f-]+$/);
  await expect(page.getByLabel("Titel")).toHaveValue(originalTitle);

  await page.getByLabel("Titel").fill(editedTitle);
  await page.getByRole("button", { name: "Übung speichern" }).click();
  await expect(page.getByLabel("Titel")).toHaveValue(editedTitle);

  const sourceUrl = page.url();
  await page.getByRole("button", { name: "Duplizieren" }).click();
  await page.waitForURL((url) => url.href !== sourceUrl);
  await expect(page.getByLabel("Titel")).toHaveValue(`${editedTitle} (Kopie)`);

  await page.getByRole("button", { name: "Archivieren" }).click();
  await expect(page.getByText("Archiviert", { exact: true })).toBeVisible();
  await page.goto("/practice/exercises");
  await expect(page.getByText(`${editedTitle} (Kopie)`, { exact: true })).toHaveCount(0);
});

test("Video wird geprüft, privat ausgeliefert und beim Ersetzen entfernt", async ({
  page,
  request,
}) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/exercises");
  await page.getByText("Brücke (Beckenheben)", { exact: true }).click();

  const videoHeading = page.getByRole("heading", { name: "Übungsvideo" });
  const videoCard = videoHeading.locator("..").locator("..");
  const fileInput = videoCard.getByLabel("Datei auswählen");

  // Deklarierter MP4-Typ mit falschem Inhalt darf nie registriert werden.
  await fileInput.setInputFiles({
    name: "disguised.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("kein video"),
  });
  await videoCard.getByRole("button", { name: "Hochladen" }).click();
  await expect(videoCard.getByText(/Dateiinhalt und Dateityp/)).toBeVisible();

  const validMp4Header = Buffer.from([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
    0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x00, 0x00,
  ]);
  await fileInput.setInputFiles({
    name: "exercise-v1.mp4",
    mimeType: "video/mp4",
    buffer: validMp4Header,
  });
  await videoCard.getByRole("button", { name: "Hochladen" }).click();
  await expect(videoCard.getByText("Das Medium wurde sicher gespeichert.")).toBeVisible();
  const firstUrl = await videoCard.locator("video source").getAttribute("src");
  expect(firstUrl).toBeTruthy();

  await videoCard.getByLabel("Neue Datei zum Ersetzen auswählen").setInputFiles({
    name: "exercise-v2.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.concat([validMp4Header, Buffer.from([0x01])]),
  });
  await videoCard.getByRole("button", { name: "Datei ersetzen" }).click();
  await expect(videoCard.getByText("Das Medium wurde sicher gespeichert.")).toBeVisible();
  const replacementUrl = await videoCard.locator("video source").getAttribute("src");
  expect(replacementUrl).toBeTruthy();
  expect(replacementUrl).not.toBe(firstUrl);

  const oldObjectResponse = await request.get(firstUrl!);
  expect(oldObjectResponse.ok()).toBe(false);

  // Brücke ist der Demo-Patientin zugewiesen: nur die autorisierte
  // Patientenseite erhält eine neue kurzlebige URL, nie der direkte Bucket.
  await page.context().clearCookies();
  await login(page, "patientin@demo.physiocheck.test");
  await page.getByRole("link", { name: /Übung „Brücke \(Beckenheben\)“ öffnen/ }).click();
  await expect(page.locator("video")).toBeVisible();
  await expect(page.locator("video source")).toHaveAttribute("src", /\/storage\/v1\/object\/sign\/exercise-media\//);
});

