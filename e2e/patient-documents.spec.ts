import { expect, test, type Page } from "@playwright/test";

/**
 * Sicherheitslücke (01.08.2026, Phase E): der Akten-Upload
 * (uploadPatientDocumentAction) lief nie durch den Malware-Scan, anders
 * als Profilbild- und Übungsvideo-Uploads, die dieselbe Prüfung längst
 * hatten. Behoben durch denselben scanBufferForMalware()-Aufruf wie dort.
 * Läuft seriell und nur einmal (chromium), weil es einen echten Upload
 * anlegt.
 */
test.describe.configure({ mode: "serial" });

const PASSWORD = "PhysioDemo2026!";
// Scans laufen bei aktiviertem MALWARE_SCAN_ENABLED über echtes clamscan;
// unter paralleler CI-Last dauert ein kalter Scan spürbar länger als lokal.
const SCAN_AWARE_TIMEOUT = { timeout: 30_000 };

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

const PDF_HEADER = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"

test("Ein echtes PDF wird als Patientenakte angenommen", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/patients");
  await page.getByRole("link", { name: /Petra Beispielfrau/ }).first().click();

  const title = `E2E-Testdokument ${Date.now()}`;
  await page.getByLabel("Titel").fill(title);
  await page.getByLabel("Datei").setInputFiles({
    name: "befund.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.concat([PDF_HEADER, Buffer.from("kein echter Praxisinhalt, nur ein E2E-Test")]),
  });
  await page.getByRole("button", { name: "Dokument hochladen" }).click();
  await expect(page.getByText("Dokument sicher hochgeladen.")).toBeVisible(SCAN_AWARE_TIMEOUT);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

test("Getarnte und mit Test-Signatur markierte Akten werden abgelehnt", async ({ page }) => {
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/patients");
  await page.getByRole("link", { name: /Petra Beispielfrau/ }).first().click();

  // Als PDF deklariert, aber falscher Inhalt – die bestehende
  // Dateisignatur-Prüfung muss das unabhängig vom Malware-Scan ablehnen.
  await page.getByLabel("Titel").fill(`E2E getarnt ${Date.now()}`);
  await page.getByLabel("Datei").setInputFiles({
    name: "getarnt.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("kein PDF"),
  });
  await page.getByRole("button", { name: "Dokument hochladen" }).click();
  await expect(page.getByText(/Dateiinhalt und Dateityp/)).toBeVisible();

  // Mit eingebetteter Test-Signatur (e2e/fixtures/clamav-test-signature.ndb,
  // kein echter Schadcode) – nur geprüft, wenn der Malware-Scan in dieser
  // Umgebung aktiviert ist (s. docs/RELEASE_READINESS.md).
  if (process.env.MALWARE_SCAN_ENABLED === "true") {
    await page.getByLabel("Titel").fill(`E2E infiziert ${Date.now()}`);
    await page.getByLabel("Datei").setInputFiles({
      name: "infiziert.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.concat([
        PDF_HEADER,
        Buffer.from("PHYSIOCHECK-E2E-TEST-MALWARE-MARKER-NOT-REAL-VIRUS"),
      ]),
    });
    await page.getByRole("button", { name: "Dokument hochladen" }).click();
    await expect(
      page.getByText("Die Datei konnte nicht sicher gespeichert werden.")
    ).toBeVisible(SCAN_AWARE_TIMEOUT);
  }
});
