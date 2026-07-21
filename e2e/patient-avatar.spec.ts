import { expect, test, type Page } from "@playwright/test";

/**
 * Profilbild-Strecke: Upload, Ablehnungen, Ersetzen, Praxisansicht und
 * Entfernen mit dem Demo-Konto. Benötigt frischen Seed und Supabase.
 */
test.describe.configure({ mode: "serial" });

const PASSWORD = "PhysioDemo2026!";

// Echtes, dekodierbares 1×1-PNG (fiktives Testbild, kein Personenfoto).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

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

/** Profilbild im Hauptbereich (nicht der kleine Kopfzeilen-Avatar). */
function mainAvatar(page: Page, name: string) {
  return page.locator("main").getByRole("img", { name: `Profilbild von ${name}` }).first();
}

test("Patientin lädt ein gültiges Bild hoch; es bleibt nach Neuladen erhalten", async ({
  page,
}) => {
  await login(page, "patientin@demo.physiocheck.test");
  await page.goto("/profile");
  // Erst nach der Hydration interagieren, sonst verpufft das change-Event.
  await page.waitForLoadState("networkidle");

  await page.locator("#avatar-file").setInputFiles({
    name: "portrait.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByText(/Das ist eine Vorschau/)).toBeVisible();
  await page.getByRole("button", { name: "Profilbild speichern" }).click();
  await expect(page.getByText("Ihr Profilbild wurde gespeichert.")).toBeVisible();
  // Sofortige Anzeige ohne Neuladen …
  await expect(mainAvatar(page, "Petra Beispielfrau").locator("img")).toHaveAttribute(
    "src",
    /patient-avatars/
  );
  // … und Persistenz: nach frischem Server-Render weiterhin vorhanden.
  await page.reload();
  await expect(mainAvatar(page, "Petra Beispielfrau").locator("img")).toHaveAttribute(
    "src",
    /patient-avatars/
  );
});

test("ungültiger Dateityp, getarnte Datei und zu große Datei werden abgelehnt", async ({
  page,
}) => {
  await login(page, "patientin@demo.physiocheck.test");
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");

  // Falscher Typ: sofortige verständliche Ablehnung ohne Upload.
  await page.locator("#avatar-file").setInputFiles({
    name: "notiz.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("kein bild"),
  });
  await expect(page.getByText(/Dieser Dateityp wird nicht unterstützt/)).toBeVisible();

  // Zu groß: über dem 5-MB-Limit.
  await page.locator("#avatar-file").setInputFiles({
    name: "riesig.png",
    mimeType: "image/png",
    buffer: Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]),
  });
  await expect(page.getByText(/Die Datei ist zu groß/)).toBeVisible();

  // Getarnte Datei: deklariert JPEG, tatsächlich PNG-Inhalt –
  // die serverseitige Magic-Byte-Prüfung lehnt bei der Finalisierung ab.
  await page.locator("#avatar-file").setInputFiles({
    name: "getarnt.jpg",
    mimeType: "image/jpeg",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Profilbild speichern" }).click();
  await expect(
    page.getByText("Dateiinhalt und Dateityp stimmen nicht überein.")
  ).toBeVisible();

  // Mit eingebetteter Test-Signatur (siehe e2e/fixtures/clamav-test-signature.ndb,
  // kein echter Schadcode) – nur geprüft, wenn der Malware-Scan in dieser
  // Umgebung aktiviert ist (siehe docs/RELEASE_READINESS.md, Bereich A4).
  // Die eingebaute EICAR-Testdatei eignet sich hier NICHT: ClamAV erkennt
  // sie nur, wenn sie exakt am Dateianfang steht (empirisch geprüft, offset
  // 0 erkannt, offset 1 bereits nicht mehr) – für eine in einer sonst
  // gültigen Datei versteckte Signatur braucht es eine eigene Testsignatur,
  // die (wie echte Virensignaturen) an beliebiger Stelle erkannt wird.
  // Gültige PNG-Magic-Bytes am Anfang, Marker danach: die
  // Größen-/Signaturprüfung lässt die Datei durch, erst der volle
  // Inhalts-Scan lehnt sie ab.
  if (process.env.MALWARE_SCAN_ENABLED === "true") {
    await page.locator("#avatar-file").setInputFiles({
      name: "infiziert.png",
      mimeType: "image/png",
      buffer: Buffer.concat([
        PNG,
        Buffer.from("PHYSIOCHECK-E2E-TEST-MALWARE-MARKER-NOT-REAL-VIRUS"),
      ]),
    });
    await page.getByRole("button", { name: "Profilbild speichern" }).click();
    await expect(
      page.getByText("Die Datei konnte nicht sicher gespeichert werden.")
    ).toBeVisible();
  }
});

test("Ersetzen entwertet die alte URL; die Praxis sieht das aktuelle Bild", async ({
  page,
  request,
}) => {
  await login(page, "patientin@demo.physiocheck.test");
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  const firstUrl = await mainAvatar(page, "Petra Beispielfrau")
    .locator("img")
    .getAttribute("src");
  expect(firstUrl).toBeTruthy();

  await page.locator("#avatar-file").setInputFiles({
    name: "portrait-neu.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await page.getByRole("button", { name: "Profilbild speichern" }).click();
  await expect(page.getByText("Ihr Profilbild wurde gespeichert.")).toBeVisible();
  await expect
    .poll(async () =>
      mainAvatar(page, "Petra Beispielfrau").locator("img").getAttribute("src")
    )
    .not.toBe(firstUrl);

  // Das alte Objekt wurde gelöscht: die alte signierte URL liefert nichts mehr.
  const oldObject = await request.get(firstUrl!);
  expect(oldObject.ok()).toBe(false);

  // Die aktuell verbundene Praxis sieht das Bild in Liste und Detail.
  await page.context().clearCookies();
  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/patients");
  await expect(
    mainAvatar(page, "Petra Beispielfrau").locator("img")
  ).toHaveAttribute("src", /patient-avatars/);
  const petraLink = page.getByRole("link", { name: /Petra Beispielfrau/ }).first();
  await page.goto((await petraLink.getAttribute("href"))!);
  await expect(
    mainAvatar(page, "Petra Beispielfrau").locator("img")
  ).toHaveAttribute("src", /patient-avatars/);
});

test("Entfernen löscht das Bild und zeigt wieder die Initialen", async ({ page }) => {
  await login(page, "patientin@demo.physiocheck.test");
  await page.goto("/profile");
  await page.waitForLoadState("networkidle");
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Profilbild entfernen" }).click();
  await expect(page.getByText("Ihr Profilbild wurde entfernt.")).toBeVisible();
  await expect(mainAvatar(page, "Petra Beispielfrau")).toContainText("PB");
  // Persistenz: auch nach frischem Server-Render nur die Initialen.
  await page.reload();
  await expect(mainAvatar(page, "Petra Beispielfrau")).toContainText("PB");
});
