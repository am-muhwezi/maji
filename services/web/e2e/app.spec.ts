import { expect, test, type Page } from "@playwright/test";

/**
 * End-to-end checks of the flows a first-day user needs. Runs at desktop width;
 * responsive layout is covered by scripts/screens.mjs. Each test starts from fresh sample data.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
});

async function noErrors(page: Page, run: () => Promise<void>) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await run();
  expect(errors).toEqual([]);
}

const PAGES: [string, RegExp][] = [
  ["/", /Dashboard/],
  ["/daily-log", /Daily Log/],
  ["/sales", /Sales/],
  ["/stock", /Stock/],
  ["/expenses", /Expenses/],
  ["/reports", /Monthly report/],
];

for (const [path, heading] of PAGES) {
  test(`${path} renders its heading with no errors, NaN or undefined`, async ({ page }) => {
    await noErrors(page, async () => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      const text = await page.locator("main").innerText();
      expect(text).not.toMatch(/NaN|undefined|Infinity/);
    });
  });
}

test("record a sale from anywhere and see it in Sales", async ({ page }) => {
  await page.goto("/stock");
  await page.getByRole("button", { name: "New entry" }).first().click();
  await page.getByRole("button", { name: /Record a sale/ }).click();
  await page.getByLabel("Customer").fill("E2E Test Shop");
  await page.getByLabel("Increase quantity").click();
  await page.getByLabel("Increase quantity").click();
  await page.getByRole("button", { name: "Save sale" }).click();
  await expect(page.getByText("Sale saved: RWF 15,000")).toBeVisible();

  await page.goto("/sales");
  await expect(page.getByRole("cell", { name: /E2E Test Shop/ }).first()).toBeVisible();
});

test("log an expense and see it at the top of Expenses", async ({ page }) => {
  await page.goto("/expenses");
  await page.getByRole("button", { name: /Log expense/ }).first().click();
  await page.getByLabel("What was it for?").fill("E2E generator fuel");
  await page.getByLabel("Amount (RWF)").fill("250000");
  await page.getByRole("button", { name: "Save expense" }).click();
  await expect(page.getByText("Expense saved: RWF 250,000")).toBeVisible();
  await expect(page.getByText("E2E generator fuel").filter({ visible: true }).first()).toBeVisible();
});

test("count stock, explain shortages, close and reopen the day", async ({ page }) => {
  await page.goto("/daily-log");
  const close = page.getByRole("button", { name: "Close day", exact: true });
  await expect(close).toBeDisabled();

  // Count the two uncounted products exactly (the desktop table is the visible one).
  for (const name of ["10L Bottle", "5L Pack"]) {
    const input = page.getByRole("textbox", { name: `Counted, ${name}` }).filter({ visible: true });
    const expectedText = await input.locator("xpath=ancestor::tr").locator("td").nth(4).innerText();
    await input.fill(expectedText.replace(/,/g, ""));
    await input.press("Tab");
  }
  await expect(page.getByText("2 shortages to explain")).toBeVisible();
  await expect(close).toBeDisabled();

  for (const name of ["20L Bottle", "18.9L Dispenser"]) {
    await page.getByRole("button", { name: `Explain shortage for ${name}` }).filter({ visible: true }).click();
    // No reason is pre-selected: saving must be a deliberate choice.
    await expect(page.getByRole("button", { name: "Pick a reason first" })).toBeDisabled();
    await page.locator("dialog[open]").getByText("Breakage or spillage").click();
    await page.getByRole("button", { name: "Save explanation" }).click();
    await expect(page.getByText(`${name}: shortage explained`)).toBeVisible();
  }

  await expect(close).toBeEnabled();
  await close.click();
  await expect(page.getByText(/Day closed by David Mugisha/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Add production/ }).first()).toBeDisabled();

  await page.getByRole("button", { name: "Reopen" }).click();
  await expect(close).toBeVisible();
});

test("mark a credit sale paid from Money owed", async ({ page }) => {
  await page.goto("/sales?show=owed");
  // SL-1041 is the seeded overdue Hotel Africana invoice.
  await page.getByRole("button", { name: "Mark SL-1041 from Hotel Africana as paid" }).filter({ visible: true }).click();
  await page.getByRole("button", { name: /Confirm Hotel Africana paid RWF 120,000/ }).filter({ visible: true }).click();
  await expect(page.getByRole("button", { name: "Mark SL-1041 from Hotel Africana as paid" })).toHaveCount(0);
  await expect(page.getByText(/days? overdue/).filter({ visible: true })).toHaveCount(0);
});

test("data survives a reload on the same day", async ({ page }) => {
  await page.goto("/daily-log");
  await page.getByRole("button", { name: /Add production/ }).first().click();
  await page.getByRole("button", { name: "Add to today" }).click();
  await expect(page.getByText("Added 50 × 20L Bottle")).toBeVisible();
  await page.reload();
  // Seeded production is 620 units; +50 must survive the reload.
  await expect(page.locator("main")).toContainText("670");
});
