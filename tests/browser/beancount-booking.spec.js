import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { readURL, writeURL } from "../../src/url-state.js";
const fixture = (file) =>
  readFile(new URL(`../fixtures/beancount/${file}`, import.meta.url), "utf8");

test("total costs and FIFO reductions survive reports, exports and shares", async ({
  page,
  context,
}) => {
  const source = await fixture("fifo.bean");
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "beancount" }),
  );
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(
    page.locator("#report-trial tr").filter({ hasText: "Assets:Stock" }),
  ).toContainText("2");
  await expect(
    page.locator("#report-trial tr").filter({ hasText: "Assets:Cash" }),
  ).toContainText("-40");
  await page.getByRole("tab", { name: "Account journal", exact: true }).click();
  const sale = page
    .locator("#report-journal tr")
    .filter({ hasText: "Reduce lots" });
  await expect(sale).toHaveCount(3); // Two booked stock lots and one inferred cash leg.
  await expect(sale.filter({ hasText: "Assets:Cash" })).toContainText("40 USD");
  await page.getByRole("button", { name: "Share", exact: true }).click();
  const shared = await page.locator("#share-url").inputValue();
  expect(readURL(shared)).toMatchObject({ src: source, format: "beancount" });
  await page.goto(shared);
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toBe(source);
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await page.locator("#download-menu summary").click();
  const pending = page.waitForEvent("download");
  await page.locator("#download-html").click();
  const download = await pending,
    exported = await context.newPage();
  await exported.setContent(await readFile(await download.path(), "utf8"));
  await expect(exported.locator("#report-trial")).toContainText("-40");
  await exported.close();
});

test("an ambiguous default booking rejects its group; explicitly choosing FIFO fixes the ledger", async ({
  page,
}) => {
  const source = await fixture("strict-ambiguous.bean");
  await page.goto(
    writeURL("http://127.0.0.1:4173/", { src: source, format: "beancount" }),
  );
  await expect(page.locator("#render-status")).toHaveText(/diagnostic/);
  await expect(page.locator("#report-errors")).toContainText(
    "Ambiguous cost lot matches",
  );
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(
    page.locator("#report-trial tr").filter({ hasText: "Assets:Cash" }),
  ).toContainText("-80");
  await page.evaluate(
    (src) =>
      ace.edit("editor").setValue('option "booking_method" "FIFO"\n' + src, -1),
    source,
  );
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(
    page.locator("#report-trial tr").filter({ hasText: "Assets:Cash" }),
  ).toContainText("-70");
});

test("booking documentation examples open runnable ledgers and the gallery uses total cost", async ({
  page,
}) => {
  await page.goto("/docs.html?page=formats/beancount");
  await expect(
    page.getByRole("heading", { name: "Total costs and lot selection" }),
  ).toBeVisible();
  const link = page
    .locator("pre")
    .filter({ hasText: '"First lot"' })
    .locator("+ p a.docs-example-link");
  await page.goto(await link.getAttribute("href"));
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toContain(
    '{{20 USD, "old"}}',
  );
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(page.locator("#report-trial")).toContainText("-40");
  await page.goto("/index.html?example=beancount-edge&format=beancount");
  await expect(page.locator("#render-status")).toHaveText(/^Ready/);
  expect(await page.evaluate(() => ace.edit("editor").getValue())).toContain(
    '{{200 USD, "first"}}',
  );
  await page.getByRole("tab", { name: "Trial balance", exact: true }).click();
  await expect(page.locator("#report-trial")).toContainText("780");
  await page.goto("/docs.html?page=limitations");
  await expect(page.locator("main")).toContainText("BEAN-09");
  await expect(page.locator("main")).toContainText("STRICT_WITH_SIZE");
});
