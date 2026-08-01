import { expect, test, type Page } from "@playwright/test";

/**
 * Terminangebote (Warteliste → Angebot → Annehmen/Ablehnen/Zurückziehen)
 * und Konfliktprüfung – im ursprünglichen Terminfehler-Auftrag als offene
 * Testszenarien benannt (s. TASKS.md/docs/TEST_MATRIX.md, Phase B/C).
 * Läuft seriell und nur einmal (chromium), weil echte Termine/Angebote
 * entstehen.
 */
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Mutierender Ablauf läuft nur einmal.");
});

const PASSWORD = "PhysioDemo2026!";
const PRACTICE_TZ = "Europe/Luxembourg";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(email);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

function dateInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function fillAppointmentForm(
  page: Page,
  { date, startTime }: { date: string; startTime: string }
) {
  await page.selectOption("#patientProfileId", { label: "Petra Beispielfrau" });
  await page.selectOption("#therapistMemberId", { label: "Tina Beispiel" });
  await page.fill("#date", date);
  await page.fill("#startTime", startTime);
}

async function createOffer(page: Page, { date, startTime }: { date: string; startTime: string }) {
  await page.goto("/practice/waitlist");
  await page.selectOption("#offer-patient", { label: "Petra Beispielfrau" });
  await page.selectOption("#offer-therapist", { label: "Tina Beispiel" });
  await page.fill("#offer-date", date);
  await page.fill("#offer-time", startTime);
  await page.getByRole("button", { name: "Angebot senden" }).click();
}

/**
 * Auf die Angebote-Sektion scopen (statt page-weit nach `<li>` zu suchen)
 * und bewusst nur den ersten Treffer nehmen: React 19 rendert dieselbe
 * Karte beim ersten Laden serverseitig kurzzeitig doppelt, bevor die
 * Hydration abschließt (im lokalen Dev-Server beobachtet, verschwindet
 * spätestens nach dem ersten Reload) – ohne `.first()` schlug Playwright
 * hier vereinzelt mit „strict mode violation: 2 elements" fehl.
 */
function offerRowByText(page: Page, ...texts: string[]) {
  let locator = page.locator('section[aria-labelledby="offers-heading"] li');
  for (const text of texts) locator = locator.filter({ hasText: text });
  return locator.first();
}

const future25 = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
const OFFER_DATE = dateInTz(future25, PRACTICE_TZ);

// Pro Lauf unterschiedliche Minute (analog zu appointments.spec.ts), damit
// ein Playwright-Retry oder ein erneuter lokaler Lauf nicht auf ein bereits
// vorhandenes Angebot aus einem vorherigen (fehlgeschlagenen) Versuch
// trifft – sonst matcht der Test-Locator mehrere Angebote zur selben Zeit.
function uniqueMinute(): string {
  return String(Math.floor((Date.now() / 1000) % 12) * 5).padStart(2, "0");
}

test("Terminangebot: Praxis sendet, Patientin nimmt an – daraus wird ein echter Termin", async ({ browser }) => {
  const startTime = `10:${uniqueMinute()}`;
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await login(staffPage, "therapeutin@demo.physiocheck.test");
  await createOffer(staffPage, { date: OFFER_DATE, startTime });
  await expect(
    staffPage.getByText("Das Angebot wurde erstellt. Der Patient wurde benachrichtigt.")
  ).toBeVisible();

  const offerRow = offerRowByText(staffPage, "Petra Beispielfrau", startTime);
  await expect(offerRow.getByText("Offen", { exact: true })).toBeVisible();
  await staffContext.close();

  const patientContext = await browser.newContext();
  const patientPage = await patientContext.newPage();
  await login(patientPage, "patientin@demo.physiocheck.test");
  await patientPage.goto("/appointments");
  const offerCard = offerRowByText(patientPage, startTime);
  await offerCard.getByRole("button", { name: "Termin annehmen" }).click();
  await expect(
    patientPage.getByText("Der Termin ist gebucht. Sie finden ihn unter Ihren Terminen.")
  ).toBeVisible();

  await patientPage.reload();
  const upcomingSection = patientPage
    .locator("section")
    .filter({ has: patientPage.getByRole("heading", { name: "Kommende Termine" }) });
  await expect(upcomingSection).toContainText(startTime);
  await patientContext.close();
});

test("Terminangebot: Patientin lehnt ab", async ({ browser }) => {
  const startTime = `11:${uniqueMinute()}`;
  const staffContext = await browser.newContext();
  const staffPage = await staffContext.newPage();
  await login(staffPage, "therapeutin@demo.physiocheck.test");
  await createOffer(staffPage, { date: OFFER_DATE, startTime });
  await expect(
    staffPage.getByText("Das Angebot wurde erstellt. Der Patient wurde benachrichtigt.")
  ).toBeVisible();
  await staffContext.close();

  const patientContext = await browser.newContext();
  const patientPage = await patientContext.newPage();
  await login(patientPage, "patientin@demo.physiocheck.test");
  await patientPage.goto("/appointments");
  const offerCard = offerRowByText(patientPage, startTime);
  await offerCard.getByRole("button", { name: "Ablehnen" }).click();
  await expect(patientPage.getByText("Das Angebot wurde abgelehnt.")).toBeVisible();
  await patientContext.close();

  const staffContext2 = await browser.newContext();
  const staffPage2 = await staffContext2.newPage();
  await login(staffPage2, "therapeutin@demo.physiocheck.test");
  await staffPage2.goto("/practice/waitlist");
  const offerRow = offerRowByText(staffPage2, "Petra Beispielfrau", startTime);
  await expect(offerRow.getByText("Abgelehnt", { exact: true })).toBeVisible();
  await expect(offerRow.getByRole("button", { name: "Angebot zurückziehen" })).toHaveCount(0);
  await staffContext2.close();
});

test("Terminangebot: Praxis zieht ein offenes Angebot zurück", async ({ page }) => {
  const startTime = `12:${uniqueMinute()}`;
  await login(page, "therapeutin@demo.physiocheck.test");
  await createOffer(page, { date: OFFER_DATE, startTime });
  await expect(
    page.getByText("Das Angebot wurde erstellt. Der Patient wurde benachrichtigt.")
  ).toBeVisible();

  const offerRow = offerRowByText(page, "Petra Beispielfrau", startTime);
  await offerRow.getByRole("button", { name: "Angebot zurückziehen" }).click();
  await expect(page.getByText("Das Angebot wurde zurückgezogen.")).toBeVisible();
  await expect(offerRow.getByText("Zurückgezogen", { exact: true })).toBeVisible();
  await expect(offerRow.getByRole("button", { name: "Angebot zurückziehen" })).toHaveCount(0);
});

test("Konfliktprüfung: ein zweiter fester Termin im selben Zeitfenster derselben Person wird abgelehnt", async ({
  page,
}) => {
  const future = new Date(Date.now() + 27 * 24 * 60 * 60 * 1000);
  const date = dateInTz(future, PRACTICE_TZ);
  const startTime = `09:${uniqueMinute()}`;

  await login(page, "therapeutin@demo.physiocheck.test");
  await page.goto("/practice/calendar/new");
  await fillAppointmentForm(page, { date, startTime });
  await page.getByRole("button", { name: "Termin speichern" }).click();
  await page.waitForURL(/\/practice\/calendar\/[0-9a-f-]+$/);

  await page.goto("/practice/calendar/new");
  await fillAppointmentForm(page, { date, startTime });
  await page.getByRole("button", { name: "Termin speichern" }).click();
  await expect(
    page.getByText("Die behandelnde Person hat in diesem Zeitraum bereits einen Termin.")
  ).toBeVisible();
  // Kein Redirect – das Formular bleibt mit der Fehlermeldung stehen.
  await expect(page).toHaveURL(/\/practice\/calendar\/new/);
});
