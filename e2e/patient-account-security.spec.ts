import { expect, test, type Page } from "@playwright/test";

const EMAIL = "patientin@demo.physiocheck.test";
const PASSWORD = "PhysioDemo2026!";
const MAILPIT = "http://127.0.0.1:54324";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Konto-E-Mails werden nur einmal gegen Mailpit geprüft.");
});

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-Mail-Adresse").fill(EMAIL);
  await page.getByLabel("Passwort").fill(PASSWORD);
  await page.getByRole("button", { name: "Anmelden" }).click();
  await page.waitForURL(/\/today$/);
}

async function mailCount(recipient: string): Promise<number> {
  const response = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${recipient}`)}`).then((result) => result.json());
  return response?.messages?.length ?? 0;
}

test("Patient fordert Passwortänderung ausschließlich für die eigene Adresse an", async ({ page }) => {
  const before = await mailCount(EMAIL);
  await login(page);
  await page.goto("/profile");
  await page.getByRole("button", { name: "Passwort ändern" }).click();
  await expect(page.getByRole("status")).toContainText("E-Mail geschickt");
  await expect.poll(() => mailCount(EMAIL)).toBeGreaterThan(before);
});

test("unveränderte E-Mail-Adresse wird ohne Versand abgewiesen", async ({ page }) => {
  await login(page);
  await page.goto("/profile");
  await page.getByLabel("Neue E-Mail-Adresse").fill(EMAIL.toUpperCase());
  await page.getByRole("button", { name: "Änderung anfordern" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "aktuelle E-Mail-Adresse" })).toBeVisible();
});
